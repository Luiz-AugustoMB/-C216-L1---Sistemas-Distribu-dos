import pytest
from fastapi import status
from fastapi.testclient import TestClient

from main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_read_root_status_code(client):
    response = client.get("/")
    assert response.status_code == status.HTTP_200_OK


def test_read_root_body(client):
    response = client.get("/")
    assert response.json() == {"message": "Olá, Sistemas Distribuídos!"}


def test_read_root_content_type(client):
    response = client.get("/")
    assert response.headers["content-type"] == "application/json"


def test_root_response_is_json_dict(client):
    response = client.get("/")
    assert isinstance(response.json(), dict)


def test_root_does_not_accept_post(client):
    response = client.post("/")
    assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED


@pytest.mark.parametrize(
    "path",
    ["/rota-inexistente", "/usuarios", "/api/v1/nao-existe"],
)
def test_unknown_routes_return_404(client, path):
    response = client.get(path)
    assert response.status_code == status.HTTP_404_NOT_FOUND
