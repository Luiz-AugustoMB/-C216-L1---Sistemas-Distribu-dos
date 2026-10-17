from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.api.routes import root, tarefas
from app.services.tarefa_service import TarefaNaoEncontradaError

app = FastAPI(title="C216 L1 - Backend")

app.include_router(root.router)
app.include_router(tarefas.router)


@app.exception_handler(TarefaNaoEncontradaError)
def tarefa_nao_encontrada(_: Request, __: TarefaNaoEncontradaError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": "Tarefa não encontrada"},
    )
