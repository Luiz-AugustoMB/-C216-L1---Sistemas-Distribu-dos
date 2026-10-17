from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import DATABASE_URL

# pool_pre_ping descarta conexões que o PostgreSQL já encerrou (ex.: após reiniciar o banco)
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Iterator[Session]:
    """Abre uma sessão por requisição e garante que ela seja fechada ao final."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
