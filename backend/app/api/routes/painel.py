from fastapi import APIRouter

from app.api.deps import Db, Hoje
from app.schemas.painel import PainelLer
from app.services import painel_service

router = APIRouter(prefix="/painel", tags=["painel"])


@router.get("", response_model=PainelLer)
def obter_painel(db: Db, hoje: Hoje):
    """Empréstimos atrasados, do mais atrasado ao menos, e os 5 livros mais emprestados."""
    return painel_service.obter(db, hoje)
