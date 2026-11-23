def test_get_health_responde_200_com_status_ok(client):
    resposta = client.get("/health")

    assert resposta.status_code == 200
    assert resposta.json() == {"status": "ok"}


def test_openapi_publica_o_titulo_acervo(client):
    resposta = client.get("/openapi.json")

    assert resposta.status_code == 200
    assert resposta.json()["info"]["title"] == "Acervo"


def test_rota_inexistente_responde_404_em_json_com_detail(client):
    resposta = client.get("/rota-que-nao-existe")

    assert resposta.status_code == 404
    assert resposta.headers["content-type"] == "application/json"
    assert "detail" in resposta.json()
