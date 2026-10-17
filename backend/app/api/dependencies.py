from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.repositories.tarefa_repository import TarefaRepository
from app.services.tarefa_service import TarefaService


def get_tarefa_service(db: Annotated[Session, Depends(get_db)]) -> TarefaService:
    return TarefaService(TarefaRepository(db))
