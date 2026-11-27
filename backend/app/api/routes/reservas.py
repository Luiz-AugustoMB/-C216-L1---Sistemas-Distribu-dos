from fastapi import APIRouter, status

from app.api.deps import Db, Hoje, IdNaRota, IdNoFiltro
from app.models import StatusReserva
from app.schemas.reserva import ReservaCriar, ReservaLer
from app.services import reserva_service

router = APIRouter(prefix="/reservas", tags=["reservas"])


@router.get("", response_model=list[ReservaLer])
def listar_reservas(
    db: Db,
    hoje: Hoje,
    livro_id: IdNoFiltro = None,
    leitor_id: IdNoFiltro = None,
    status: StatusReserva | None = None,
):
    return reserva_service.listar(db, hoje, livro_id=livro_id, leitor_id=leitor_id, status=status)


@router.post("", response_model=ReservaLer, status_code=status.HTTP_201_CREATED)
def criar_reserva(dados: ReservaCriar, db: Db, hoje: Hoje):
    return reserva_service.criar(db, dados, hoje)


@router.delete("/{reserva_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancelar_reserva(reserva_id: IdNaRota, db: Db, hoje: Hoje):
    """Cancela a reserva. O registro fica no histórico com status cancelada."""
    reserva_service.cancelar(db, reserva_id, hoje)
