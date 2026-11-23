import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    # O "with" executa a inicialização e o encerramento da aplicação, como no servidor
    with TestClient(app) as test_client:
        yield test_client
