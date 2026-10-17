from pydantic import BaseModel, ConfigDict, Field, model_validator


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

    @model_validator(mode="after")
    def rejeitar_null_em_campos_obrigatorios(self) -> "TarefaUpdate":
        # Omitir o campo mantém o valor atual; enviar null só é válido para a
        # descrição, pois título e status são NOT NULL no banco
        for campo in ("titulo", "concluida"):
            if campo in self.model_fields_set and getattr(self, campo) is None:
                raise ValueError(f"{campo} não pode ser null")
        return self


class TarefaRead(TarefaBase):
    """Resposta da API; from_attributes permite montá-la a partir do modelo ORM."""

    model_config = ConfigDict(from_attributes=True)

    id: int
