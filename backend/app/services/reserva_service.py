from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.erros import RecursoNaoEncontrado, RegraDeNegocioViolada
from app.models import Livro, Reserva, StatusReserva
from app.repositories import (
    emprestimo_repository,
    leitor_repository,
    livro_repository,
    reserva_repository,
)
from app.schemas.comum import LeitorResumo, LivroResumo
from app.schemas.reserva import ReservaCriar, ReservaLer
from app.services import regras


def contar_disponiveis(db: Session, livro: Livro) -> int:
    ocupacao = livro_repository.ocupacao(db, [livro.id])[livro.id]
    return regras.calcular_disponiveis(livro.exemplares, ocupacao.emprestados, ocupacao.separados)


def promover_fila(db: Session, livro: Livro, hoje: date) -> None:
    """Separa cada exemplar livre para o próximo da fila, na ordem de pedido."""
    vagas = contar_disponiveis(db, livro)
    if vagas <= 0:
        return
    prazo = get_settings().prazo_retirada_reserva_dias
    for reserva in reserva_repository.fila(db, livro.id)[:vagas]:
        reserva.status = StatusReserva.AGUARDANDO_RETIRADA
        reserva.separada_em = func.now()
        reserva.expira_em = regras.calcular_expiracao_reserva(hoje, prazo)
    db.flush()


def processar_vencidas(db: Session, hoje: date) -> None:
    """Expira as reservas não retiradas no prazo e passa o exemplar para o próximo da fila.

    Não há agendador: isto roda no começo de toda operação que depende da fila ou da
    disponibilidade. O resultado é o mesmo de um processo diário, porque ninguém enxerga
    a fila sem passar por aqui antes.
    """
    vencidas = [
        reserva
        for reserva in reserva_repository.aguardando_retirada(db)
        if regras.reserva_vencida(reserva.expira_em, hoje)
    ]
    if not vencidas:
        return
    for reserva in vencidas:
        reserva.status = StatusReserva.EXPIRADA
    db.flush()
    for livro_id in sorted({reserva.livro_id for reserva in vencidas}):
        promover_fila(db, livro_repository.buscar(db, livro_id), hoje)
    db.commit()


def para_leitura(reserva: Reserva, posicao_na_fila: int | None = None) -> ReservaLer:
    return ReservaLer(
        id=reserva.id,
        livro=LivroResumo(id=reserva.livro.id, titulo=reserva.livro.titulo),
        leitor=LeitorResumo(id=reserva.leitor.id, nome=reserva.leitor.nome),
        status=reserva.status,
        criada_em=reserva.criada_em,
        separada_em=reserva.separada_em,
        expira_em=reserva.expira_em,
        posicao_na_fila=posicao_na_fila if reserva.status == StatusReserva.NA_FILA else None,
    )


def listar(
    db: Session,
    hoje: date,
    livro_id: int | None = None,
    leitor_id: int | None = None,
    status: StatusReserva | None = None,
) -> list[ReservaLer]:
    processar_vencidas(db, hoje)
    reservas = reserva_repository.listar(db, livro_id=livro_id, leitor_id=leitor_id, status=status)
    posicoes = reserva_repository.posicoes_na_fila(db, sorted({r.livro_id for r in reservas}))
    return [para_leitura(reserva, posicoes.get(reserva.id)) for reserva in reservas]


def criar(db: Session, dados: ReservaCriar, hoje: date) -> ReservaLer:
    processar_vencidas(db, hoje)
    livro = livro_repository.buscar(db, dados.livro_id)
    if livro is None:
        raise RecursoNaoEncontrado("Livro não encontrado.")
    leitor = leitor_repository.buscar(db, dados.leitor_id)
    if leitor is None:
        raise RecursoNaoEncontrado("Leitor não encontrado.")

    if contar_disponiveis(db, livro) > 0:
        raise RegraDeNegocioViolada(
            "Há exemplar disponível deste livro. Faça o empréstimo direto, sem reserva."
        )
    em_aberto = emprestimo_repository.em_aberto(db, [leitor.id])
    if any(emprestimo.livro_id == livro.id for emprestimo in em_aberto):
        raise RegraDeNegocioViolada("O leitor já está com este livro.")
    if reserva_repository.aberta_do_leitor(db, livro.id, leitor.id) is not None:
        raise RegraDeNegocioViolada("O leitor já tem uma reserva aberta para este livro.")

    reserva = reserva_repository.adicionar(db, Reserva(livro_id=livro.id, leitor_id=leitor.id))
    db.commit()
    posicoes = reserva_repository.posicoes_na_fila(db, [livro.id])
    return para_leitura(reserva, posicoes.get(reserva.id))


def cancelar(db: Session, reserva_id: int, hoje: date) -> None:
    processar_vencidas(db, hoje)
    reserva = reserva_repository.buscar(db, reserva_id)
    if reserva is None:
        raise RecursoNaoEncontrado("Reserva não encontrada.")
    if reserva.status not in reserva_repository.STATUS_ABERTOS:
        raise RegraDeNegocioViolada("Esta reserva já foi encerrada e não pode ser cancelada.")

    estava_separada = reserva.status == StatusReserva.AGUARDANDO_RETIRADA
    reserva.status = StatusReserva.CANCELADA
    db.flush()
    if estava_separada:
        # O exemplar que estava guardado passa para o próximo da fila ou volta a ficar livre
        promover_fila(db, reserva.livro, hoje)
    db.commit()
