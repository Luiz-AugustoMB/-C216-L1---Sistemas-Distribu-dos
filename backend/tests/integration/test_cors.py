import pytest
from fastapi import status
from sqlalchemy.exc import OperationalError

from app.api.dependencies import get_tarefa_service
from app.main import app

ORIGEM_FRONTEND = "http://localhost:5173"
ORIGEM_ESTRANHA = "http://site-estranho.com"


def preflight(client, origem, metodo="POST", headers="Content-Type"):
    return client.options(
        "/tarefas",
        headers={
            "Origin": origem,
            "Access-Control-Request-Method": metodo,
            "Access-Control-Request-Headers": headers,
        },
    )


def test_resposta_libera_a_origem_do_frontend(client):
    response = client.get("/tarefas", headers={"Origin": ORIGEM_FRONTEND})
    assert response.headers["access-control-allow-origin"] == ORIGEM_FRONTEND


def test_resposta_nao_libera_outra_origem(client):
    response = client.get("/tarefas", headers={"Origin": ORIGEM_ESTRANHA})
    assert "access-control-allow-origin" not in response.headers


def test_nunca_responde_com_curinga(client):
    response = client.get("/tarefas", headers={"Origin": ORIGEM_FRONTEND})
    assert response.headers["access-control-allow-origin"] != "*"


@pytest.mark.parametrize("metodo", ["GET", "POST", "PUT", "PATCH", "DELETE"])
def test_preflight_aceita_os_metodos_da_api(client, metodo):
    response = preflight(client, ORIGEM_FRONTEND, metodo)
    assert response.status_code == status.HTTP_200_OK
    assert response.headers["access-control-allow-origin"] == ORIGEM_FRONTEND
    assert metodo in response.headers["access-control-allow-methods"]


def test_preflight_rejeita_outra_origem(client):
    response = preflight(client, ORIGEM_ESTRANHA)
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_preflight_rejeita_metodo_nao_listado(client):
    response = preflight(client, ORIGEM_FRONTEND, "TRACE")
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_preflight_rejeita_header_nao_listado(client):
    response = preflight(client, ORIGEM_FRONTEND, headers="Authorization")
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_erro_de_banco_vira_503_com_detail_e_headers_de_cors(client):
    def service_sem_banco():
        raise OperationalError("SELECT 1", {}, Exception("conexão recusada"))

    app.dependency_overrides[get_tarefa_service] = service_sem_banco
    response = client.get("/tarefas", headers={"Origin": ORIGEM_FRONTEND})

    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    assert response.json() == {"detail": "Não foi possível acessar o banco de dados."}
    assert response.headers["access-control-allow-origin"] == ORIGEM_FRONTEND


def test_erro_inesperado_vira_500_com_detail_e_headers_de_cors(client):
    def service_quebrado():
        raise ValueError("bug qualquer")

    app.dependency_overrides[get_tarefa_service] = service_quebrado
    response = client.get("/tarefas", headers={"Origin": ORIGEM_FRONTEND})

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert response.json() == {"detail": "Erro interno na API."}
    assert response.headers["access-control-allow-origin"] == ORIGEM_FRONTEND
