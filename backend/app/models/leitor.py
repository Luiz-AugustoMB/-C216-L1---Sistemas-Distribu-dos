from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.emprestimo import Emprestimo
    from app.models.reserva import Reserva


class Leitor(Base):
    __tablename__ = "leitores"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(150))
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Mesma regra do livro: quem bloqueia a exclusão com histórico é a FK do banco
    emprestimos: Mapped[list["Emprestimo"]] = relationship(
        back_populates="leitor", passive_deletes="all"
    )
    reservas: Mapped[list["Reserva"]] = relationship(back_populates="leitor", passive_deletes="all")
