from fastapi import FastAPI

from routers import root, tarefas

app = FastAPI(title="C216 L1 - Backend")

app.include_router(root.router)
app.include_router(tarefas.router)
