from sqlalchemy import String, false
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class Tarefa(Base):
    """Como a tarefa é armazenada no banco (tabela "tarefas")."""

    __tablename__ = "tarefas"

    id: Mapped[int] = mapped_column(primary_key=True)
    titulo: Mapped[str] = mapped_column(String(100))
    descricao: Mapped[str | None] = mapped_column(String(500))
    # server_default garante o valor também em inserts feitos fora da aplicação
    concluida: Mapped[bool] = mapped_column(default=False, server_default=false())
