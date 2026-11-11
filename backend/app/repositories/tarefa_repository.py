from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.tarefa import Tarefa


class TarefaRepository:
    """Acesso às tarefas no banco; não conhece HTTP nem regras de negócio."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def listar(self, concluida: bool | None = None) -> list[Tarefa]:
        consulta = select(Tarefa).order_by(Tarefa.id)
        if concluida is not None:
            consulta = consulta.where(Tarefa.concluida == concluida)
        return list(self.db.scalars(consulta))

    def buscar(self, tarefa_id: int) -> Tarefa | None:
        return self.db.get(Tarefa, tarefa_id)

    def salvar(self, tarefa: Tarefa) -> Tarefa:
        """Insere uma tarefa nova ou grava as alterações de uma já carregada."""
        self.db.add(tarefa)
        self.db.commit()
        self.db.refresh(tarefa)
        return tarefa

    def remover(self, tarefa: Tarefa) -> None:
        self.db.delete(tarefa)
        self.db.commit()
