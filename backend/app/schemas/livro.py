from datetime import datetime
from typing import Annotated

from pydantic import AfterValidator, BaseModel, Field

from app.core.relogio import hoje
from app.schemas.comum import MAIOR_INTEIRO, AtualizacaoParcial, texto_obrigatorio

ANO_MINIMO = 1450


def normalizar_isbn(valor: str) -> str:
    # Aceita "978-85-7605-142-8" ou "9788576051428" e guarda só os dígitos, para o
    # mesmo livro não entrar duas vezes por causa da formatação
    digitos = valor.replace("-", "").replace(" ", "")
    if not (digitos.isascii() and digitos.isdigit() and len(digitos) in (10, 13)):
        raise ValueError("O ISBN deve ter 10 ou 13 dígitos, com ou sem hífen.")
    return digitos


def validar_ano(ano: int) -> int:
    limite = hoje().year + 1
    if not ANO_MINIMO <= ano <= limite:
        raise ValueError(f"O ano deve estar entre {ANO_MINIMO} e {limite}.")
    return ano


Titulo = texto_obrigatorio(200)
Autor = texto_obrigatorio(200)
Isbn = Annotated[str, AfterValidator(normalizar_isbn)]
Ano = Annotated[int, AfterValidator(validar_ano)]
Exemplares = Annotated[int, Field(ge=1, le=MAIOR_INTEIRO)]


class LivroCriar(BaseModel):
    titulo: Titulo
    autor: Autor
    isbn: Isbn
    ano: Ano
    exemplares: Exemplares


class LivroAtualizar(LivroCriar):
    """PUT: todos os campos são obrigatórios."""


class LivroAtualizarParcial(AtualizacaoParcial):
    titulo: Titulo | None = None
    autor: Autor | None = None
    isbn: Isbn | None = None
    ano: Ano | None = None
    exemplares: Exemplares | None = None


class LivroLer(BaseModel):
    id: int
    titulo: str
    autor: str
    isbn: str
    ano: int
    exemplares: int
    criado_em: datetime
    disponiveis: int
    emprestados: int
    separados_para_reserva: int
    tamanho_fila: int
