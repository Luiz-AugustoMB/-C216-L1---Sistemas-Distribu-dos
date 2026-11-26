from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.leitor import Leitor
    from app.models.livro import Livro


class Emprestimo(Base):
    # Sem coluna de status: ativo, atrasado ou devolvido sai das datas, então não tem
    # como ficar desatualizado
    __tablename__ = "emprestimos"
    __table_args__ = (
        CheckConstraint("renovacoes BETWEEN 0 AND 2", name="renovacoes_entre_0_e_2"),
        CheckConstraint("data_prevista >= data_emprestimo", name="prevista_depois_do_emprestimo"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    # RESTRICT: livro ou leitor com empréstimo não pode ser excluído
    livro_id: Mapped[int] = mapped_column(ForeignKey("livros.id", ondelete="RESTRICT"), index=True)
    leitor_id: Mapped[int] = mapped_column(
        ForeignKey("leitores.id", ondelete="RESTRICT"), index=True
    )
    data_emprestimo: Mapped[date]
    data_prevista: Mapped[date]
    data_devolucao: Mapped[date | None]
    renovacoes: Mapped[int] = mapped_column(default=0, server_default="0")

    livro: Mapped["Livro"] = relationship(back_populates="emprestimos")
    leitor: Mapped["Leitor"] = relationship(back_populates="emprestimos")
