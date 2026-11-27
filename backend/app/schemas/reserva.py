from datetime import date, datetime

from pydantic import BaseModel

from app.models import StatusReserva
from app.schemas.comum import IdRegistro, LeitorResumo, LivroResumo


class ReservaCriar(BaseModel):
    livro_id: IdRegistro
    leitor_id: IdRegistro


class ReservaLer(BaseModel):
    id: int
    livro: LivroResumo
    leitor: LeitorResumo
    status: StatusReserva
    criada_em: datetime
    separada_em: datetime | None
    expira_em: date | None
    # Só para quem está na_fila: 1 é o próximo a receber um exemplar
    posicao_na_fila: int | None
