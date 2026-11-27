from datetime import date

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.erros import RecursoNaoEncontrado, RegraDeNegocioViolada
from app.models import Emprestimo, StatusReserva
from app.repositories import (
    emprestimo_repository,
    leitor_repository,
    livro_repository,
    reserva_repository,
)
from app.schemas.comum import LeitorResumo, LivroResumo
from app.schemas.emprestimo import EmprestimoCriar, EmprestimoLer
from app.services import regras, reserva_service
from app.services.regras import StatusEmprestimo


def para_leitura(emprestimo: Emprestimo, hoje: date) -> EmprestimoLer:
    return EmprestimoLer(
        id=emprestimo.id,
        livro=LivroResumo(id=emprestimo.livro.id, titulo=emprestimo.livro.titulo),
        leitor=LeitorResumo(id=emprestimo.leitor.id, nome=emprestimo.leitor.nome),
        data_emprestimo=emprestimo.data_emprestimo,
        data_prevista=emprestimo.data_prevista,
        data_devolucao=emprestimo.data_devolucao,
        renovacoes=emprestimo.renovacoes,
        status=regras.status_emprestimo(emprestimo.data_prevista, emprestimo.data_devolucao, hoje),
        dias_atraso=regras.dias_atraso(emprestimo.data_prevista, emprestimo.data_devolucao, hoje),
    )


def _buscar_ou_falhar(db: Session, emprestimo_id: int) -> Emprestimo:
    emprestimo = emprestimo_repository.buscar(db, emprestimo_id)
    if emprestimo is None:
        raise RecursoNaoEncontrado("Empréstimo não encontrado.")
    return emprestimo


def listar(
    db: Session,
    hoje: date,
    status: StatusEmprestimo | None = None,
    livro_id: int | None = None,
    leitor_id: int | None = None,
) -> list[EmprestimoLer]:
    resultado = [
        para_leitura(emprestimo, hoje)
        for emprestimo in emprestimo_repository.listar(db, livro_id=livro_id, leitor_id=leitor_id)
    ]
    # O status não é coluna: o filtro usa a mesma regra que calcula o status mostrado
    if status is not None:
        resultado = [emprestimo for emprestimo in resultado if emprestimo.status == status]
    return resultado


def obter(db: Session, emprestimo_id: int, hoje: date) -> EmprestimoLer:
    return para_leitura(_buscar_ou_falhar(db, emprestimo_id), hoje)


def criar(db: Session, dados: EmprestimoCriar, hoje: date) -> EmprestimoLer:
    reserva_service.processar_vencidas(db, hoje)
    config = get_settings()
    livro = livro_repository.buscar(db, dados.livro_id)
    if livro is None:
        raise RecursoNaoEncontrado("Livro não encontrado.")
    leitor = leitor_repository.buscar(db, dados.leitor_id)
    if leitor is None:
        raise RecursoNaoEncontrado("Leitor não encontrado.")

    em_aberto = emprestimo_repository.em_aberto(db, [leitor.id])
    motivo = regras.motivo_para_nao_emprestar(
        tem_atraso=any(
            regras.status_emprestimo(e.data_prevista, e.data_devolucao, hoje)
            == StatusEmprestimo.ATRASADO
            for e in em_aberto
        ),
        emprestimos_abertos=len(em_aberto),
        max_emprestimos=config.max_emprestimos_ativos,
        ja_esta_com_o_livro=any(e.livro_id == livro.id for e in em_aberto),
    )
    if motivo:
        raise RegraDeNegocioViolada(motivo)

    reserva = reserva_repository.aberta_do_leitor(db, livro.id, leitor.id)
    separado_para_o_leitor = (
        reserva is not None and reserva.status == StatusReserva.AGUARDANDO_RETIRADA
    )
    # Quem tem exemplar separado leva esse exemplar; os outros só levam um livre
    if not separado_para_o_leitor and reserva_service.contar_disponiveis(db, livro) <= 0:
        raise RegraDeNegocioViolada(
            f'Não há exemplar disponível de "{livro.titulo}". '
            "O leitor pode entrar na fila de reserva."
        )
    if reserva is not None:
        reserva.status = StatusReserva.CONCLUIDA

    emprestimo = emprestimo_repository.adicionar(
        db,
        Emprestimo(
            livro_id=livro.id,
            leitor_id=leitor.id,
            data_emprestimo=hoje,
            data_prevista=regras.calcular_data_prevista(hoje, config.prazo_emprestimo_dias),
        ),
    )
    db.commit()
    return para_leitura(emprestimo, hoje)


def devolver(db: Session, emprestimo_id: int, hoje: date) -> EmprestimoLer:
    reserva_service.processar_vencidas(db, hoje)
    emprestimo = _buscar_ou_falhar(db, emprestimo_id)
    if emprestimo.data_devolucao is not None:
        raise RegraDeNegocioViolada("Este empréstimo já foi devolvido.")

    emprestimo.data_devolucao = hoje
    db.flush()
    # O exemplar devolvido vai para o primeiro da fila, se houver alguém esperando
    reserva_service.promover_fila(db, emprestimo.livro, hoje)
    db.commit()
    return para_leitura(emprestimo, hoje)


def renovar(db: Session, emprestimo_id: int, hoje: date) -> EmprestimoLer:
    reserva_service.processar_vencidas(db, hoje)
    config = get_settings()
    emprestimo = _buscar_ou_falhar(db, emprestimo_id)

    motivo = regras.motivo_para_nao_renovar(
        status=regras.status_emprestimo(emprestimo.data_prevista, emprestimo.data_devolucao, hoje),
        renovacoes=emprestimo.renovacoes,
        max_renovacoes=config.max_renovacoes,
        tem_fila=reserva_repository.contar_abertas_do_livro(db, emprestimo.livro_id) > 0,
    )
    if motivo:
        raise RegraDeNegocioViolada(motivo)

    emprestimo.data_prevista = regras.calcular_data_prevista(
        emprestimo.data_prevista, config.prazo_emprestimo_dias
    )
    emprestimo.renovacoes += 1
    db.commit()
    return para_leitura(emprestimo, hoje)
