from fastapi import FastAPI

app = FastAPI(
    title="Acervo",
    description="Empréstimos e fila de reserva dos livros técnicos da sala de estudos.",
)


@app.get("/health")
def health():
    return {"status": "ok"}
