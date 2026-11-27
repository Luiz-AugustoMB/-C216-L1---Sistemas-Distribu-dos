from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app.api.routes import emprestimos, health, leitores, livros, painel, reservas
from app.core.erros import RecursoNaoEncontrado, RegraDeNegocioViolada

app = FastAPI(
    title="Acervo",
    description="Empréstimos e fila de reserva dos livros técnicos da sala de estudos.",
)


def responder_nao_encontrado(_: Request, erro: RecursoNaoEncontrado) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"detail": erro.mensagem})


def responder_regra_violada(_: Request, erro: RegraDeNegocioViolada) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_409_CONFLICT, content={"detail": erro.mensagem})


def responder_conflito_no_banco(_: Request, __: IntegrityError) -> JSONResponse:
    # Rede de segurança: os services conferem as regras antes de gravar, então isto só
    # acontece quando duas requisições disputam o mesmo dado ao mesmo tempo
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={
            "detail": "Os dados mudaram enquanto a operação era feita. Atualize e tente de novo."
        },
    )


app.add_exception_handler(RecursoNaoEncontrado, responder_nao_encontrado)
app.add_exception_handler(RegraDeNegocioViolada, responder_regra_violada)
app.add_exception_handler(IntegrityError, responder_conflito_no_banco)

for modulo in (health, livros, leitores, emprestimos, reservas, painel):
    app.include_router(modulo.router)
