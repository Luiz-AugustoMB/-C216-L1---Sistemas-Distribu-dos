from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.emprestimo import Emprestimo
    from app.models.reserva import Reserva


class Livro(Base):
    __tablename__ = "livros"
    __table_args__ = (CheckConstraint("exemplares >= 1", name="exemplares_minimo_1"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    titulo: Mapped[str] = mapped_column(String(200))
    autor: Mapped[str] = mapped_column(String(200))
    # unique com index vira um único índice único, que serve à busca e barra duplicados
    isbn: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    ano: Mapped[int]
    exemplares: Mapped[int]
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # passive_deletes="all": o ORM não mexe nos filhos ao excluir o livro e deixa a FK
    # do banco recusar a exclusão
    emprestimos: Mapped[list["Emprestimo"]] = relationship(
        back_populates="livro", passive_deletes="all"
    )
    reservas: Mapped[list["Reserva"]] = relationship(back_populates="livro", passive_deletes="all")
