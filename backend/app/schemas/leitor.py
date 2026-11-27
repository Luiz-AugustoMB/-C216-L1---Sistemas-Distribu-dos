from datetime import datetime
from typing import Annotated

from pydantic import AfterValidator, BaseModel, EmailStr

from app.schemas.comum import AtualizacaoParcial, texto_obrigatorio

Nome = texto_obrigatorio(150)
# Minúsculo para "Ana@Exemplo.com" e "ana@exemplo.com" serem o mesmo leitor
Email = Annotated[EmailStr, AfterValidator(str.lower)]


class LeitorCriar(BaseModel):
    nome: Nome
    email: Email


class LeitorAtualizar(LeitorCriar):
    """PUT: todos os campos são obrigatórios."""


class LeitorAtualizarParcial(AtualizacaoParcial):
    nome: Nome | None = None
    email: Email | None = None


class LeitorLer(BaseModel):
    id: int
    nome: str
    email: str
    criado_em: datetime
    emprestimos_ativos: int
    possui_atraso: bool
