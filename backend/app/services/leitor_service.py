from datetime import date

from sqlalchemy.orm import Session

from app.core.erros import RecursoNaoEncontrado, RegraDeNegocioViolada
from app.models import Emprestimo, Leitor
from app.repositories import emprestimo_repository, leitor_repository
from app.schemas.emprestimo import EmprestimoLer
from app.schemas.leitor import LeitorCriar, LeitorLer
from app.services import emprestimo_service, regras


def para_leitura(leitor: Leitor, em_aberto: list[Emprestimo], hoje: date) -> LeitorLer:
    return LeitorLer(
        id=leitor.id,
        nome=leitor.nome,
        email=leitor.email,
        criado_em=leitor.criado_em,
        emprestimos_ativos=len(em_aberto),
        possui_atraso=any(
            regras.status_emprestimo(e.data_prevista, e.data_devolucao, hoje)
            == regras.StatusEmprestimo.ATRASADO
            for e in em_aberto
        ),
    )


def _buscar_ou_falhar(db: Session, leitor_id: int) -> Leitor:
    leitor = leitor_repository.buscar(db, leitor_id)
    if leitor is None:
        raise RecursoNaoEncontrado("Leitor não encontrado.")
    return leitor


def _ler(db: Session, leitor: Leitor, hoje: date) -> LeitorLer:
    return para_leitura(leitor, emprestimo_repository.em_aberto(db, [leitor.id]), hoje)


def _garantir_email_livre(db: Session, email: str, leitor_id: int | None = None) -> None:
    existente = leitor_repository.buscar_por_email(db, email)
    if existente is not None and existente.id != leitor_id:
        raise RegraDeNegocioViolada("Já existe um leitor cadastrado com este e-mail.")


def listar(db: Session, hoje: date, busca: str | None = None) -> list[LeitorLer]:
    leitores = leitor_repository.listar(db, busca)
    em_aberto: dict[int, list[Emprestimo]] = {leitor.id: [] for leitor in leitores}
    for emprestimo in emprestimo_repository.em_aberto(db, list(em_aberto)):
        em_aberto[emprestimo.leitor_id].append(emprestimo)
    return [para_leitura(leitor, em_aberto[leitor.id], hoje) for leitor in leitores]


def obter(db: Session, leitor_id: int, hoje: date) -> LeitorLer:
    return _ler(db, _buscar_ou_falhar(db, leitor_id), hoje)


def criar(db: Session, dados: LeitorCriar, hoje: date) -> LeitorLer:
    _garantir_email_livre(db, dados.email)
    leitor = leitor_repository.adicionar(db, Leitor(**dados.model_dump()))
    db.commit()
    return para_leitura(leitor, [], hoje)


def atualizar(db: Session, leitor_id: int, campos: dict, hoje: date) -> LeitorLer:
    """Serve ao PUT (todos os campos) e ao PATCH (só os enviados)."""
    leitor = _buscar_ou_falhar(db, leitor_id)
    if "email" in campos:
        _garantir_email_livre(db, campos["email"], leitor.id)
    for campo, valor in campos.items():
        setattr(leitor, campo, valor)
    db.commit()
    return _ler(db, leitor, hoje)


def excluir(db: Session, leitor_id: int) -> None:
    leitor = _buscar_ou_falhar(db, leitor_id)
    if leitor_repository.possui_historico(db, leitor.id):
        raise RegraDeNegocioViolada(
            "Este leitor tem empréstimos ou reservas registrados e não pode ser excluído, "
            "para não perder o histórico."
        )
    leitor_repository.excluir(db, leitor)
    db.commit()


def listar_emprestimos(db: Session, leitor_id: int, hoje: date) -> list[EmprestimoLer]:
    _buscar_ou_falhar(db, leitor_id)
    return emprestimo_service.listar(db, hoje, leitor_id=leitor_id)
