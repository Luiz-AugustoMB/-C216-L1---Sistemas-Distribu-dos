from schemas.tarefa import Tarefa, TarefaCreate, TarefaUpdate


class TarefaRepository:
    """Armazena as tarefas em memória."""

    def __init__(self) -> None:
        self._tarefas: dict[int, Tarefa] = {}
        self._proximo_id = 1

    def listar(self, concluida: bool | None = None) -> list[Tarefa]:
        tarefas = list(self._tarefas.values())
        if concluida is not None:
            tarefas = [t for t in tarefas if t.concluida == concluida]
        return tarefas

    def buscar(self, tarefa_id: int) -> Tarefa | None:
        return self._tarefas.get(tarefa_id)

    def criar(self, dados: TarefaCreate) -> Tarefa:
        tarefa = Tarefa(id=self._proximo_id, **dados.model_dump())
        self._tarefas[tarefa.id] = tarefa
        self._proximo_id += 1
        return tarefa

    def substituir(self, tarefa_id: int, dados: TarefaCreate) -> Tarefa | None:
        if tarefa_id not in self._tarefas:
            return None
        tarefa = Tarefa(id=tarefa_id, **dados.model_dump())
        self._tarefas[tarefa_id] = tarefa
        return tarefa

    def atualizar_parcial(self, tarefa_id: int, dados: TarefaUpdate) -> Tarefa | None:
        tarefa_atual = self._tarefas.get(tarefa_id)
        if tarefa_atual is None:
            return None
        # exclude_unset: aplica só os campos enviados, permitindo limpar a descrição com null
        tarefa = tarefa_atual.model_copy(update=dados.model_dump(exclude_unset=True))
        self._tarefas[tarefa_id] = tarefa
        return tarefa

    def remover(self, tarefa_id: int) -> bool:
        return self._tarefas.pop(tarefa_id, None) is not None


_repositorio = TarefaRepository()


def get_repository() -> TarefaRepository:
    return _repositorio
