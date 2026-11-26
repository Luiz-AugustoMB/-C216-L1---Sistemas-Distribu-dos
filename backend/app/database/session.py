from collections.abc import Iterator
from functools import lru_cache

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


@lru_cache
def get_engine() -> Engine:
    # Criado na primeira sessão, não no import: a rota /health sobe mesmo sem banco
    return create_engine(get_settings().database_url)


@lru_cache
def get_session_factory() -> sessionmaker[Session]:
    return sessionmaker(bind=get_engine())


def get_db() -> Iterator[Session]:
    # Dependência das rotas da Etapa 5: uma sessão por requisição, fechada no final
    with get_session_factory()() as session:
        yield session
