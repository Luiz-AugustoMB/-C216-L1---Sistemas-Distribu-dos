import pytest
from fastapi import status


@pytest.fixture
def tarefa(client):
    response = client.post(
        "/tarefas", json={"titulo": "Estudar FastAPI", "descricao": "Prática 4"}
    )
    return response.json()


# GET /tarefas


def test_listar_vazio(client):
    response = client.get("/tarefas")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


def test_listar_retorna_tarefas_criadas(client, tarefa):
    response = client.get("/tarefas")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == [tarefa]


@pytest.mark.parametrize(("concluida", "esperado"), [(True, ["A"]), (False, ["B"])])
def test_listar_filtra_por_query_concluida(client, concluida, esperado):
    client.post("/tarefas", json={"titulo": "A", "concluida": True})
    client.post("/tarefas", json={"titulo": "B"})
    response = client.get("/tarefas", params={"concluida": concluida})
    assert response.status_code == status.HTTP_200_OK
    assert [t["titulo"] for t in response.json()] == esperado


def test_listar_query_invalida_retorna_422(client):
    response = client.get("/tarefas", params={"concluida": "talvez"})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


# GET /tarefas/{id}


def test_buscar_por_id(client, tarefa):
    response = client.get(f"/tarefas/{tarefa['id']}")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == tarefa


def test_buscar_inexistente_retorna_404(client):
    response = client.get("/tarefas/99")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Tarefa não encontrada"}


@pytest.mark.parametrize("tarefa_id", ["0", "-1", "abc"])
def test_buscar_id_invalido_retorna_422(client, tarefa_id):
    response = client.get(f"/tarefas/{tarefa_id}")
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


# POST /tarefas


def test_criar_tarefa(client):
    response = client.post("/tarefas", json={"titulo": "Estudar FastAPI"})
    assert response.status_code == status.HTTP_201_CREATED
    assert response.json() == {
        "id": 1,
        "titulo": "Estudar FastAPI",
        "descricao": None,
        "concluida": False,
    }


@pytest.mark.parametrize(
    "corpo",
    [{}, {"titulo": ""}, {"titulo": "x" * 101}, {"titulo": "A", "concluida": "talvez"}],
)
def test_criar_tarefa_invalida_retorna_422(client, corpo):
    response = client.post("/tarefas", json=corpo)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


# PUT /tarefas/{id}


def test_substituir_tarefa(client, tarefa):
    response = client.put(
        f"/tarefas/{tarefa['id']}", json={"titulo": "Nova", "concluida": True}
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {
        "id": tarefa["id"],
        "titulo": "Nova",
        "descricao": None,
        "concluida": True,
    }
    assert client.get(f"/tarefas/{tarefa['id']}").json() == response.json()


def test_substituir_inexistente_retorna_404(client):
    response = client.put("/tarefas/99", json={"titulo": "Nova"})
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_substituir_sem_campo_obrigatorio_retorna_422(client, tarefa):
    response = client.put(f"/tarefas/{tarefa['id']}", json={"concluida": True})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


# PATCH /tarefas/{id}


def test_atualizar_parcialmente(client, tarefa):
    response = client.patch(f"/tarefas/{tarefa['id']}", json={"concluida": True})
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {**tarefa, "concluida": True}


def test_atualizar_parcialmente_limpa_descricao_com_null(client, tarefa):
    response = client.patch(f"/tarefas/{tarefa['id']}", json={"descricao": None})
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["descricao"] is None
    assert response.json()["titulo"] == tarefa["titulo"]


def test_atualizar_parcialmente_corpo_vazio_nao_altera(client, tarefa):
    response = client.patch(f"/tarefas/{tarefa['id']}", json={})
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == tarefa


def test_atualizar_parcialmente_inexistente_retorna_404(client):
    response = client.patch("/tarefas/99", json={"concluida": True})
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_atualizar_parcialmente_titulo_vazio_retorna_422(client, tarefa):
    response = client.patch(f"/tarefas/{tarefa['id']}", json={"titulo": ""})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


# DELETE /tarefas/{id}


def test_remover_tarefa(client, tarefa):
    response = client.delete(f"/tarefas/{tarefa['id']}")
    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert response.content == b""
    assert (
        client.get(f"/tarefas/{tarefa['id']}").status_code == status.HTTP_404_NOT_FOUND
    )


def test_remover_inexistente_retorna_404(client):
    response = client.delete("/tarefas/99")
    assert response.status_code == status.HTTP_404_NOT_FOUND


# Isolamento entre testes


def test_estado_nao_vaza_entre_testes(client):
    assert client.get("/tarefas").json() == []
