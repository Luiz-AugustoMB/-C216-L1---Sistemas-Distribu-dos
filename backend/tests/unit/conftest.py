import pytest

from app.models.tarefa import Tarefa
from app.services.tarefa_service import TarefaService


class FakeTarefaRepository:
    """Substitui o repository real para testar o service sem banco de dados."""

    def __init__(self) -> None:
        self.tarefas: dict[int, Tarefa] = {}
        self._proximo_id = 1

    def listar(self, concluida: bool | None = None) -> list[Tarefa]:
        tarefas = list(self.tarefas.values())
        if concluida is not None:
            tarefas = [t for t in tarefas if t.concluida == concluida]
        return tarefas

    def buscar(self, tarefa_id: int) -> Tarefa | None:
        return self.tarefas.get(tarefa_id)

    def salvar(self, tarefa: Tarefa) -> Tarefa:
        if tarefa.id is None:
            tarefa.id = self._proximo_id
            self._proximo_id += 1
        self.tarefas[tarefa.id] = tarefa
        return tarefa

    def remover(self, tarefa: Tarefa) -> None:
        del self.tarefas[tarefa.id]


@pytest.fixture
def repo():
    return FakeTarefaRepository()


@pytest.fixture
def service(repo):
    return TarefaService(repo)
