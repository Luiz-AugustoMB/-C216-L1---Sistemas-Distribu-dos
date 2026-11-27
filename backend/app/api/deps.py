from datetime import date
from typing import Annotated

from fastapi import Depends, Path, Query
from sqlalchemy.orm import Session

from app.core.relogio import hoje
from app.database.session import get_db
from app.schemas.comum import MAIOR_INTEIRO


def get_hoje() -> date:
    # Os testes trocam esta dependência por um relógio que eles mesmos avançam
    return hoje()


Db = Annotated[Session, Depends(get_db)]
Hoje = Annotated[date, Depends(get_hoje)]
# Ids fora da faixa da coluna integer viram 422 aqui, em vez de erro no banco
IdNaRota = Annotated[int, Path(ge=1, le=MAIOR_INTEIRO)]
IdNoFiltro = Annotated[int | None, Query(ge=1, le=MAIOR_INTEIRO)]
