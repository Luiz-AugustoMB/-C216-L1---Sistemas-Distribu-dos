import pytest

LEITOR = {"nome": "  Ana Souza ", "email": "Ana.Souza@Exemplo.com"}


def test_cria_leitor_com_email_minusculo_e_nome_sem_espacos(api):
    resposta = api.post("/leitores", json=LEITOR)

    assert resposta.status_code == 201
    leitor = resposta.json()
    assert leitor["nome"] == "Ana Souza"
    assert leitor["email"] == "ana.souza@exemplo.com"
    assert leitor["emprestimos_ativos"] == 0
    assert leitor["possui_atraso"] is False


def test_obtem_lista_e_busca_leitores(api, cadastrar_leitor):
    bruno = cadastrar_leitor(nome="Bruno Lima", email="bruno@exemplo.com")
    cadastrar_leitor(nome="Ana Souza", email="ana@outro.com")

    assert api.get(f"/leitores/{bruno['id']}").json()["nome"] == "Bruno Lima"
    assert [leitor["nome"] for leitor in api.get("/leitores").json()] == ["Ana Souza", "Bruno Lima"]
    assert [leitor["id"] for leitor in api.get("/leitores", params={"busca": "LIMA"}).json()] == [
        bruno["id"]
    ]
    assert [leitor["id"] for leitor in api.get("/leitores", params={"busca": "bruno@"}).json()] == [
        bruno["id"]
    ]


def test_put_e_patch_de_leitor(api, cadastrar_leitor):
    leitor = cadastrar_leitor()

    put = api.put(f"/leitores/{leitor['id']}", json=LEITOR)
    patch = api.patch(f"/leitores/{leitor['id']}", json={"nome": "Ana S."})

    assert put.status_code == 200
    assert put.json()["email"] == "ana.souza@exemplo.com"
    assert patch.status_code == 200
    assert patch.json()["nome"] == "Ana S."
    assert patch.json()["email"] == "ana.souza@exemplo.com"


def test_exclui_leitor_sem_historico(api, cadastrar_leitor):
    leitor = cadastrar_leitor()

    assert api.delete(f"/leitores/{leitor['id']}").status_code == 204
    assert api.get(f"/leitores/{leitor['id']}").status_code == 404


@pytest.mark.parametrize(
    ("metodo", "caminho", "corpo"),
    [
        ("GET", "/leitores/999999", None),
        ("GET", "/leitores/999999/emprestimos", None),
        ("PUT", "/leitores/999999", LEITOR),
        ("PATCH", "/leitores/999999", {"nome": "X"}),
        ("DELETE", "/leitores/999999", None),
    ],
)
def test_leitor_inexistente_responde_404(api, metodo, caminho, corpo):
    argumentos = {"json": corpo} if corpo is not None else {}

    resposta = api.request(metodo, caminho, **argumentos)

    assert resposta.status_code == 404
    assert resposta.json() == {"detail": "Leitor não encontrado."}


@pytest.mark.parametrize(
    "campos",
    [{"email": "sem-arroba"}, {"email": ""}, {"nome": "   "}],
    ids=["email-invalido", "email-vazio", "nome-so-espacos"],
)
def test_dados_invalidos_respondem_422(api, campos):
    assert api.post("/leitores", json=LEITOR | campos).status_code == 422


def test_patch_com_null_responde_422(api, cadastrar_leitor):
    leitor = cadastrar_leitor()

    assert api.patch(f"/leitores/{leitor['id']}", json={"email": None}).status_code == 422


def test_email_duplicado_responde_409_sem_diferenciar_maiusculas(api, cadastrar_leitor):
    cadastrar_leitor(email="ana.souza@exemplo.com")

    resposta = api.post("/leitores", json=LEITOR)

    assert resposta.status_code == 409
    assert "e-mail" in resposta.json()["detail"]


def test_trocar_para_email_de_outro_leitor_responde_409(api, cadastrar_leitor):
    cadastrar_leitor(email="ana.souza@exemplo.com")
    outro = cadastrar_leitor()

    resposta = api.patch(f"/leitores/{outro['id']}", json={"email": "ANA.SOUZA@exemplo.com"})

    assert resposta.status_code == 409


def test_excluir_leitor_com_historico_responde_409(
    api, cadastrar_livro, cadastrar_leitor, reservar, emprestar
):
    livro = cadastrar_livro()
    emprestar(livro, cadastrar_leitor())
    leitor = cadastrar_leitor()
    reserva = reservar(livro, leitor)
    api.delete(f"/reservas/{reserva['id']}")

    resposta = api.delete(f"/leitores/{leitor['id']}")

    assert resposta.status_code == 409
    assert "histórico" in resposta.json()["detail"]


def test_lista_os_emprestimos_do_leitor(api, cadastrar_livro, cadastrar_leitor, emprestar):
    leitor = cadastrar_leitor()
    emprestimo = emprestar(cadastrar_livro(), leitor)
    emprestar(cadastrar_livro(), cadastrar_leitor())

    resposta = api.get(f"/leitores/{leitor['id']}/emprestimos")

    assert resposta.status_code == 200
    assert [item["id"] for item in resposta.json()] == [emprestimo["id"]]


def test_leitor_mostra_emprestimos_ativos_e_atraso(
    api, relogio, cadastrar_livro, cadastrar_leitor, emprestar
):
    leitor = cadastrar_leitor()
    emprestar(cadastrar_livro(), leitor)
    emprestar(cadastrar_livro(), leitor)

    assert api.get(f"/leitores/{leitor['id']}").json()["emprestimos_ativos"] == 2
    assert api.get(f"/leitores/{leitor['id']}").json()["possui_atraso"] is False

    relogio.avancar(15)

    assert api.get(f"/leitores/{leitor['id']}").json()["possui_atraso"] is True
