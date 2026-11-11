from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, status

from app.api.dependencies import get_tarefa_service
from app.schemas.tarefa import TarefaCreate, TarefaRead, TarefaUpdate
from app.services.tarefa_service import TarefaService

router = APIRouter(prefix="/tarefas", tags=["tarefas"])

Service = Annotated[TarefaService, Depends(get_tarefa_service)]
TarefaId = Annotated[int, Path(gt=0, description="ID da tarefa")]


@router.get("", response_model=list[TarefaRead])
def listar_tarefas(
    service: Service,
    concluida: Annotated[bool | None, Query(description="Filtra por status")] = None,
):
    return service.listar(concluida)


@router.get("/{tarefa_id}", response_model=TarefaRead)
def buscar_tarefa(tarefa_id: TarefaId, service: Service):
    return service.buscar(tarefa_id)


@router.post("", response_model=TarefaRead, status_code=status.HTTP_201_CREATED)
def criar_tarefa(dados: TarefaCreate, service: Service):
    return service.criar(dados)


@router.put("/{tarefa_id}", response_model=TarefaRead)
def substituir_tarefa(tarefa_id: TarefaId, dados: TarefaCreate, service: Service):
    return service.substituir(tarefa_id, dados)


@router.patch("/{tarefa_id}", response_model=TarefaRead)
def atualizar_tarefa(tarefa_id: TarefaId, dados: TarefaUpdate, service: Service):
    return service.atualizar_parcial(tarefa_id, dados)


@router.delete("/{tarefa_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_tarefa(tarefa_id: TarefaId, service: Service):
    service.remover(tarefa_id)
