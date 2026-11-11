import logging

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.api.routes import root, tarefas
from app.core.config import CORS_ORIGINS
from app.services.tarefa_service import TarefaNaoEncontradaError

logger = logging.getLogger("uvicorn.error")

app = FastAPI(title="C216 L1 - Backend")


# O 500 padrão é gerado por fora do CORSMiddleware e sai sem os headers de CORS: o
# navegador bloquearia a resposta e acusaria a API inteira como inacessível. Um
# exception_handler(Exception) também roda por fora, por isso é um middleware,
# registrado antes do CORS para ficar por dentro dele.
@app.middleware("http")
async def erro_inesperado(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception:
        logger.exception("Erro inesperado em %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Erro interno na API."},
        )


app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)

app.include_router(root.router)
app.include_router(tarefas.router)


@app.exception_handler(TarefaNaoEncontradaError)
def tarefa_nao_encontrada(_: Request, __: TarefaNaoEncontradaError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": "Tarefa não encontrada"},
    )


@app.exception_handler(SQLAlchemyError)
def banco_indisponivel(_: Request, __: SQLAlchemyError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "Não foi possível acessar o banco de dados."},
    )
