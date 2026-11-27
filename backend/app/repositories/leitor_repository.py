from sqlalchemy import exists, or_, select
from sqlalchemy.orm import Session

from app.models import Emprestimo, Leitor, Reserva


def buscar(db: Session, leitor_id: int) -> Leitor | None:
    return db.get(Leitor, leitor_id)


def buscar_por_email(db: Session, email: str) -> Leitor | None:
    return db.scalar(select(Leitor).where(Leitor.email == email))


def listar(db: Session, busca: str | None = None) -> list[Leitor]:
    consulta = select(Leitor).order_by(Leitor.nome, Leitor.id)
    if busca:
        consulta = consulta.where(
            or_(
                Leitor.nome.icontains(busca, autoescape=True),
                Leitor.email.icontains(busca, autoescape=True),
            )
        )
    return list(db.scalars(consulta))


def possui_historico(db: Session, leitor_id: int) -> bool:
    return bool(
        db.scalar(
            select(
                exists().where(Emprestimo.leitor_id == leitor_id)
                | exists().where(Reserva.leitor_id == leitor_id)
            )
        )
    )


def adicionar(db: Session, leitor: Leitor) -> Leitor:
    db.add(leitor)
    db.flush()
    return leitor


def excluir(db: Session, leitor: Leitor) -> None:
    db.delete(leitor)
    db.flush()
