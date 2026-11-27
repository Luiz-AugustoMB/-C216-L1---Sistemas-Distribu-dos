from app.core.config import Settings

ORIGEM_DO_FRONTEND = "http://localhost:5173"


def preflight(client, origem):
    return client.options(
        "/livros",
        headers={"Origin": origem, "Access-Control-Request-Method": "POST"},
    )


def test_preflight_de_origem_permitida_recebe_o_header(client):
    resposta = preflight(client, ORIGEM_DO_FRONTEND)

    assert resposta.status_code == 200
    assert resposta.headers["access-control-allow-origin"] == ORIGEM_DO_FRONTEND


def test_preflight_de_origem_desconhecida_nao_recebe_o_header(client):
    resposta = preflight(client, "http://site-desconhecido.example")

    assert "access-control-allow-origin" not in resposta.headers


def test_origens_cors_aceita_lista_separada_por_virgula():
    configuracao = Settings(
        database_url="postgresql+psycopg://x:y@localhost/z",
        cors_origins=" http://localhost:5173 , http://127.0.0.1:5173 ,",
    )

    assert configuracao.origens_cors == ["http://localhost:5173", "http://127.0.0.1:5173"]
