from pydantic import BaseModel, Field


class TarefaBase(BaseModel):
    titulo: str = Field(min_length=1, max_length=100)
    descricao: str | None = Field(default=None, max_length=500)
    concluida: bool = False


class TarefaCreate(TarefaBase):
    """Corpo completo da tarefa, usado no POST e no PUT."""


class TarefaUpdate(BaseModel):
    """Corpo parcial da tarefa, usado no PATCH: todos os campos são opcionais."""

    titulo: str | None = Field(default=None, min_length=1, max_length=100)
    descricao: str | None = Field(default=None, max_length=500)
    concluida: bool | None = None


class Tarefa(TarefaBase):
    id: int
