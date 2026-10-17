import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401  (registra as tabelas em Base.metadata)
from app.database.base import Base
from app.database.session import get_db
from app.main import app

# Sem a variável, os testes usam SQLite em memória e rodam sem Docker;
# na CI ela aponta para um PostgreSQL real.
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "sqlite+pysqlite://")


@pytest.fixture
def engine():
    if TEST_DATABASE_URL.startswith("sqlite"):
        # StaticPool mantém uma única conexão, para o banco em memória não sumir
        # entre sessões; check_same_thread=False porque o TestClient usa outra thread
        engine = create_engine(
            TEST_DATABASE_URL,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
    else:
        engine = create_engine(TEST_DATABASE_URL)

    # Cada teste recebe tabelas novas, sem estado compartilhado
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def session_factory(engine):
    return sessionmaker(bind=engine, autoflush=False, autocommit=False)


@pytest.fixture
def db(session_factory):
    with session_factory() as session:
        yield session


@pytest.fixture
def client(session_factory):
    def get_test_db():
        with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = get_test_db
    yield TestClient(app)
    app.dependency_overrides.clear()
