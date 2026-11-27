from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models import Reserva, StatusReserva

STATUS_ABERTOS = (StatusReserva.NA_FILA, StatusReserva.AGUARDANDO_RETIRADA)

_COM_LIVRO_E_LEITOR = (joinedload(Reserva.livro), joinedload(Reserva.leitor))
# Ordem da fila: quem pediu primeiro; no empate (mesmo instante), o id menor
_ORDEM_DA_FILA = (Reserva.criada_em, Reserva.id)


def buscar(db: Session, reserva_id: int) -> Reserva | None:
    return db.get(Reserva, reserva_id, options=_COM_LIVRO_E_LEITOR)


def listar(
    db: Session,
    livro_id: int | None = None,
    leitor_id: int | None = None,
    status: StatusReserva | None = None,
) -> list[Reserva]:
    consulta = select(Reserva).options(*_COM_LIVRO_E_LEITOR).order_by(*_ORDEM_DA_FILA)
    if livro_id is not None:
        consulta = consulta.where(Reserva.livro_id == livro_id)
    if leitor_id is not None:
        consulta = consulta.where(Reserva.leitor_id == leitor_id)
    if status is not None:
        consulta = consulta.where(Reserva.status == status)
    return list(db.scalars(consulta))


def fila(db: Session, livro_id: int) -> list[Reserva]:
    return list(
        db.scalars(
            select(Reserva)
            .where(Reserva.livro_id == livro_id, Reserva.status == StatusReserva.NA_FILA)
            .order_by(*_ORDEM_DA_FILA)
        )
    )


def posicoes_na_fila(db: Session, livro_ids: list[int]) -> dict[int, int]:
    """Posição de cada reserva na_fila dentro da fila do seu livro, começando em 1."""
    if not livro_ids:
        return {}
    posicao = func.row_number().over(partition_by=Reserva.livro_id, order_by=_ORDEM_DA_FILA)
    consulta = select(Reserva.id, posicao).where(
        Reserva.livro_id.in_(livro_ids), Reserva.status == StatusReserva.NA_FILA
    )
    return dict(db.execute(consulta).all())


def aberta_do_leitor(db: Session, livro_id: int, leitor_id: int) -> Reserva | None:
    return db.scalar(
        select(Reserva).where(
            Reserva.livro_id == livro_id,
            Reserva.leitor_id == leitor_id,
            Reserva.status.in_(STATUS_ABERTOS),
        )
    )


def aguardando_retirada(db: Session) -> list[Reserva]:
    return list(
        db.scalars(
            select(Reserva)
            .where(Reserva.status == StatusReserva.AGUARDANDO_RETIRADA)
            .order_by(Reserva.expira_em, Reserva.id)
        )
    )


def contar_abertas_do_livro(db: Session, livro_id: int) -> int:
    return db.scalar(
        select(func.count()).where(Reserva.livro_id == livro_id, Reserva.status.in_(STATUS_ABERTOS))
    )


def adicionar(db: Session, reserva: Reserva) -> Reserva:
    db.add(reserva)
    db.flush()
    return reserva
