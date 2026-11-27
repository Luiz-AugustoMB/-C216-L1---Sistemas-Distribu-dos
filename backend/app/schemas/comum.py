from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints, model_validator

# Maior valor da coluna integer do PostgreSQL. Acima disso o banco recusa a consulta e a
# API responderia 500, então a entrada é barrada antes, com 422
MAIOR_INTEIRO = 2_147_483_647

IdRegistro = Annotated[int, Field(ge=1, le=MAIOR_INTEIRO)]


def texto_obrigatorio(tamanho_maximo: int):
    # Tira os espaços das pontas antes de validar: "   " vira vazio e é recusado
    return Annotated[
        str, StringConstraints(strip_whitespace=True, min_length=1, max_length=tamanho_maximo)
    ]


class AtualizacaoParcial(BaseModel):
    """Base dos schemas de PATCH: campo omitido fica como está, mas null é recusado."""

    @model_validator(mode="after")
    def recusar_nulos(self):
        nulos = sorted(campo for campo in self.model_fields_set if getattr(self, campo) is None)
        if nulos:
            raise ValueError(f"Campos que não podem ficar vazios: {', '.join(nulos)}")
        return self

    def campos_enviados(self) -> dict:
        return self.model_dump(exclude_unset=True)


class LivroResumo(BaseModel):
    id: int
    titulo: str


class LeitorResumo(BaseModel):
    id: int
    nome: str
