import pytest
from fastapi.testclient import TestClient

from main import app
from repositories.tarefa_repository import TarefaRepository, get_repository


@pytest.fixture
def repo():
    return TarefaRepository()


@pytest.fixture
def client(repo):
    # Cada teste recebe um repositório vazio, sem estado compartilhado
    app.dependency_overrides[get_repository] = lambda: repo
    yield TestClient(app)
    app.dependency_overrides.clear()
