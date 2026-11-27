from dataclasses import dataclass

from sqlalchemy import exists, func, or_, select
from sqlalchemy.orm import Session

from app.models import Emprestimo, Livro, Reserva, StatusReserva


@dataclass(frozen=True)
class OcupacaoLivro:
    emprestados: int = 0
    separados: int = 0
    na_fila: int = 0


def buscar(db: Session, livro_id: int) -> Livro | None:
    return db.get(Livro, livro_id)


def buscar_por_isbn(db: Session, isbn: str) -> Livro | None:
    return db.scalar(select(Livro).where(Livro.isbn == isbn))


def listar(db: Session, busca: str | None = None) -> list[Livro]:
    consulta = select(Livro).order_by(Livro.titulo, Livro.id)
    if busca:
        consulta = consulta.where(
            or_(
                Livro.titulo.icontains(busca, autoescape=True),
                Livro.autor.icontains(busca, autoescape=True),
            )
        )
    return list(db.scalars(consulta))


def ocupacao(db: Session, livro_ids: list[int]) -> dict[int, OcupacaoLivro]:
    """Empréstimos em aberto e reservas abertas de cada livro, em duas consultas."""
    if not livro_ids:
        return {}

    emprestados = dict(
        db.execute(
            select(Emprestimo.livro_id, func.count())
            .where(Emprestimo.livro_id.in_(livro_ids), Emprestimo.data_devolucao.is_(None))
            .group_by(Emprestimo.livro_id)
        ).all()
    )

    separados: dict[int, int] = {}
    na_fila: dict[int, int] = {}
    reservas = db.execute(
        select(Reserva.livro_id, Reserva.status, func.count())
        .where(
            Reserva.livro_id.in_(livro_ids),
            Reserva.status.in_([StatusReserva.NA_FILA, StatusReserva.AGUARDANDO_RETIRADA]),
        )
        .group_by(Reserva.livro_id, Reserva.status)
    ).all()
    for livro_id, status, total in reservas:
        destino = separados if status == StatusReserva.AGUARDANDO_RETIRADA else na_fila
        destino[livro_id] = total

    return {
        livro_id: OcupacaoLivro(
            emprestados=emprestados.get(livro_id, 0),
            separados=separados.get(livro_id, 0),
            na_fila=na_fila.get(livro_id, 0),
        )
        for livro_id in livro_ids
    }


def possui_historico(db: Session, livro_id: int) -> bool:
    return bool(
        db.scalar(
            select(
                exists().where(Emprestimo.livro_id == livro_id)
                | exists().where(Reserva.livro_id == livro_id)
            )
        )
    )


def mais_emprestados(db: Session, limite: int) -> list[tuple[Livro, int]]:
    total = func.count(Emprestimo.id)
    consulta = (
        select(Livro, total)
        .join(Emprestimo, Emprestimo.livro_id == Livro.id)
        .group_by(Livro.id)
        .order_by(total.desc(), Livro.titulo)
        .limit(limite)
    )
    return [tuple(linha) for linha in db.execute(consulta)]


def adicionar(db: Session, livro: Livro) -> Livro:
    db.add(livro)
    db.flush()
    return livro


def excluir(db: Session, livro: Livro) -> None:
    db.delete(livro)
    db.flush()
