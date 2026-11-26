from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.database.session import get_engine
from app.main import app

ALEMBIC_INI = Path(__file__).resolve().parents[1] / "alembic.ini"


@pytest.fixture
def client():
    # O "with" executa a inicialização e o encerramento da aplicação, como no servidor
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="session")
def banco_migrado():
    # Só roda quando algum teste pede db_session: os testes de /health não tocam no banco.
    # As tabelas vêm das migrations, então os testes também conferem a migration
    command.upgrade(Config(str(ALEMBIC_INI)), "head")
    engine = get_engine()
    yield engine
    engine.dispose()


@pytest.fixture
def db_session(banco_migrado):
    # Cada teste roda numa transação desfeita no final: nada fica gravado no banco e a
    # ordem dos testes não importa. Com create_savepoint, um commit feito pelo código
    # testado vira savepoint e também é desfeito
    with banco_migrado.connect() as conexao:
        transacao = conexao.begin()
        sessao = Session(bind=conexao, join_transaction_mode="create_savepoint")
        try:
            yield sessao
        finally:
            sessao.close()
            transacao.rollback()
