from datetime import date, timedelta
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api.deps import get_hoje
from app.database.session import get_db, get_engine
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


class RelogioDeTeste:
    """Data de "hoje" que o próprio teste controla."""

    def __init__(self, hoje: date) -> None:
        self.hoje = hoje

    def avancar(self, dias: int) -> None:
        self.hoje += timedelta(days=dias)


@pytest.fixture
def relogio():
    # Data fixa: nenhum teste depende do dia em que roda
    return RelogioDeTeste(date(2026, 3, 2))


@pytest.fixture
def api(db_session, relogio):
    # A API usa a sessão da transação desfeita do teste e o relógio controlável
    app.dependency_overrides[get_db] = lambda: db_session
    app.dependency_overrides[get_hoje] = lambda: relogio.hoje
    try:
        with TestClient(app) as cliente:
            yield cliente
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
def cadastrar_livro(api):
    contador = iter(range(1, 1000))

    def cadastrar(**campos):
        numero = next(contador)
        dados = {
            "titulo": f"Livro {numero}",
            "autor": "Autora Exemplo",
            "isbn": f"978000000{numero:04d}",
            "ano": 2020,
            "exemplares": 1,
        } | campos
        resposta = api.post("/livros", json=dados)
        assert resposta.status_code == 201, resposta.text
        return resposta.json()

    return cadastrar


@pytest.fixture
def cadastrar_leitor(api):
    contador = iter(range(1, 1000))

    def cadastrar(**campos):
        numero = next(contador)
        dados = {"nome": f"Leitor {numero}", "email": f"leitor{numero}@exemplo.com"} | campos
        resposta = api.post("/leitores", json=dados)
        assert resposta.status_code == 201, resposta.text
        return resposta.json()

    return cadastrar


@pytest.fixture
def emprestar(api):
    def emprestar(livro, leitor):
        resposta = api.post(
            "/emprestimos", json={"livro_id": livro["id"], "leitor_id": leitor["id"]}
        )
        assert resposta.status_code == 201, resposta.text
        return resposta.json()

    return emprestar


@pytest.fixture
def reservar(api):
    def reservar(livro, leitor):
        resposta = api.post("/reservas", json={"livro_id": livro["id"], "leitor_id": leitor["id"]})
        assert resposta.status_code == 201, resposta.text
        return resposta.json()

    return reservar
