import enum
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Index, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.leitor import Leitor
    from app.models.livro import Livro


class StatusReserva(enum.StrEnum):
    NA_FILA = "na_fila"
    AGUARDANDO_RETIRADA = "aguardando_retirada"
    CONCLUIDA = "concluida"
    EXPIRADA = "expirada"
    CANCELADA = "cancelada"


class Reserva(Base):
    __tablename__ = "reservas"
    __table_args__ = (
        # Parcial: o leitor só pode ter uma reserva aberta por livro, mas as fechadas
        # (concluídas, expiradas, canceladas) ficam no histórico sem bloquear uma nova
        Index(
            "ux_reservas_aberta_livro_leitor",
            "livro_id",
            "leitor_id",
            unique=True,
            postgresql_where=text("status IN ('na_fila', 'aguardando_retirada')"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    livro_id: Mapped[int] = mapped_column(ForeignKey("livros.id", ondelete="RESTRICT"), index=True)
    leitor_id: Mapped[int] = mapped_column(
        ForeignKey("leitores.id", ondelete="RESTRICT"), index=True
    )
    # A ordem da fila é a ordem de criação
    criada_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    # native_enum=False guarda texto com CHECK em vez de um tipo enum do PostgreSQL, que
    # exigiria migration própria para cada valor novo. values_callable grava "na_fila", não
    # o nome do membro
    status: Mapped[StatusReserva] = mapped_column(
        Enum(
            StatusReserva,
            name="status",
            native_enum=False,
            create_constraint=True,
            length=30,
            values_callable=lambda membros: [membro.value for membro in membros],
        ),
        default=StatusReserva.NA_FILA,
        server_default=StatusReserva.NA_FILA.value,
    )
    separada_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expira_em: Mapped[date | None]

    livro: Mapped["Livro"] = relationship(back_populates="reservas")
    leitor: Mapped["Leitor"] = relationship(back_populates="reservas")
