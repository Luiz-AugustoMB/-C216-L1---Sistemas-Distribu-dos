from app.models.tarefa import Tarefa
from app.repositories.tarefa_repository import TarefaRepository
from app.schemas.tarefa import TarefaCreate, TarefaUpdate


class TarefaNaoEncontradaError(Exception):
    """A tarefa pedida não existe; a camada HTTP traduz isso em 404."""


class TarefaService:
    """Regras de negócio das tarefas, independentes de HTTP e do banco usado."""

    def __init__(self, repo: TarefaRepository) -> None:
        self.repo = repo

    def listar(self, concluida: bool | None = None) -> list[Tarefa]:
        return self.repo.listar(concluida)

    def buscar(self, tarefa_id: int) -> Tarefa:
        tarefa = self.repo.buscar(tarefa_id)
        if tarefa is None:
            raise TarefaNaoEncontradaError(tarefa_id)
        return tarefa

    def criar(self, dados: TarefaCreate) -> Tarefa:
        return self.repo.salvar(Tarefa(**dados.model_dump()))

    def substituir(self, tarefa_id: int, dados: TarefaCreate) -> Tarefa:
        return self._aplicar(self.buscar(tarefa_id), dados.model_dump())

    def atualizar_parcial(self, tarefa_id: int, dados: TarefaUpdate) -> Tarefa:
        # exclude_unset: aplica só os campos enviados, permitindo limpar a descrição com null
        return self._aplicar(
            self.buscar(tarefa_id), dados.model_dump(exclude_unset=True)
        )

    def remover(self, tarefa_id: int) -> None:
        self.repo.remover(self.buscar(tarefa_id))

    def _aplicar(self, tarefa: Tarefa, campos: dict) -> Tarefa:
        for campo, valor in campos.items():
            setattr(tarefa, campo, valor)
        return self.repo.salvar(tarefa)
