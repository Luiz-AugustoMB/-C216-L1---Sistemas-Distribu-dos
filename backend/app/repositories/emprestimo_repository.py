from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models import Emprestimo

# Toda leitura de empréstimo mostra o título do livro e o nome do leitor
_COM_LIVRO_E_LEITOR = (joinedload(Emprestimo.livro), joinedload(Emprestimo.leitor))


def buscar(db: Session, emprestimo_id: int) -> Emprestimo | None:
    return db.get(Emprestimo, emprestimo_id, options=_COM_LIVRO_E_LEITOR)


def listar(
    db: Session, livro_id: int | None = None, leitor_id: int | None = None
) -> list[Emprestimo]:
    consulta = (
        select(Emprestimo)
        .options(*_COM_LIVRO_E_LEITOR)
        .order_by(Emprestimo.data_emprestimo.desc(), Emprestimo.id.desc())
    )
    if livro_id is not None:
        consulta = consulta.where(Emprestimo.livro_id == livro_id)
    if leitor_id is not None:
        consulta = consulta.where(Emprestimo.leitor_id == leitor_id)
    return list(db.scalars(consulta))


def em_aberto(db: Session, leitor_ids: list[int] | None = None) -> list[Emprestimo]:
    """Empréstimos ainda não devolvidos, de todos os leitores ou só dos informados."""
    consulta = (
        select(Emprestimo)
        .options(*_COM_LIVRO_E_LEITOR)
        .where(Emprestimo.data_devolucao.is_(None))
        .order_by(Emprestimo.data_prevista, Emprestimo.id)
    )
    if leitor_ids is not None:
        consulta = consulta.where(Emprestimo.leitor_id.in_(leitor_ids))
    return list(db.scalars(consulta))


def adicionar(db: Session, emprestimo: Emprestimo) -> Emprestimo:
    db.add(emprestimo)
    db.flush()
    return emprestimo
