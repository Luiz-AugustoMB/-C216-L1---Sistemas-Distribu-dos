from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from repositories.tarefa_repository import TarefaRepository, get_repository
from schemas.tarefa import Tarefa, TarefaCreate, TarefaUpdate

router = APIRouter(prefix="/tarefas", tags=["tarefas"])

Repo = Annotated[TarefaRepository, Depends(get_repository)]
TarefaId = Annotated[int, Path(gt=0, description="ID da tarefa")]


def _ou_404(tarefa: Tarefa | None) -> Tarefa:
    if tarefa is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tarefa não encontrada")
    return tarefa


@router.get("", response_model=list[Tarefa])
def listar_tarefas(
    repo: Repo,
    concluida: Annotated[bool | None, Query(description="Filtra por status")] = None,
):
    return repo.listar(concluida)


@router.get("/{tarefa_id}", response_model=Tarefa)
def buscar_tarefa(tarefa_id: TarefaId, repo: Repo):
    return _ou_404(repo.buscar(tarefa_id))


@router.post("", response_model=Tarefa, status_code=status.HTTP_201_CREATED)
def criar_tarefa(dados: TarefaCreate, repo: Repo):
    return repo.criar(dados)


@router.put("/{tarefa_id}", response_model=Tarefa)
def substituir_tarefa(tarefa_id: TarefaId, dados: TarefaCreate, repo: Repo):
    return _ou_404(repo.substituir(tarefa_id, dados))


@router.patch("/{tarefa_id}", response_model=Tarefa)
def atualizar_tarefa(tarefa_id: TarefaId, dados: TarefaUpdate, repo: Repo):
    return _ou_404(repo.atualizar_parcial(tarefa_id, dados))


@router.delete("/{tarefa_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_tarefa(tarefa_id: TarefaId, repo: Repo):
    if not repo.remover(tarefa_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tarefa não encontrada")
