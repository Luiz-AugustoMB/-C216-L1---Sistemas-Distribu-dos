import pytest

from app.services import livro_service

LIVRO = {
    "titulo": "  Sistemas Distribuídos  ",
    "autor": "Andrew Tanenbaum",
    "isbn": "978-85-7605-142-8",
    "ano": 2007,
    "exemplares": 2,
}


def test_cria_livro_com_isbn_normalizado_e_texto_sem_espacos(api):
    resposta = api.post("/livros", json=LIVRO)

    assert resposta.status_code == 201
    livro = resposta.json()
    assert livro["titulo"] == "Sistemas Distribuídos"
    assert livro["isbn"] == "9788576051428"
    assert livro["disponiveis"] == 2
    assert livro["emprestados"] == 0
    assert livro["separados_para_reserva"] == 0
    assert livro["tamanho_fila"] == 0


def test_obtem_lista_e_busca_livros(api, cadastrar_livro):
    redes = cadastrar_livro(titulo="Redes de Computadores", autor="Kurose")
    cadastrar_livro(titulo="Algoritmos", autor="Cormen")

    assert api.get(f"/livros/{redes['id']}").json()["titulo"] == "Redes de Computadores"
    assert [livro["titulo"] for livro in api.get("/livros").json()] == [
        "Algoritmos",
        "Redes de Computadores",
    ]
    assert [livro["id"] for livro in api.get("/livros", params={"busca": "kuro"}).json()] == [
        redes["id"]
    ]
    assert [livro["id"] for livro in api.get("/livros", params={"busca": "redes"}).json()] == [
        redes["id"]
    ]


def test_filtra_livros_por_disponibilidade(api, cadastrar_livro, cadastrar_leitor, emprestar):
    livre = cadastrar_livro()
    ocupado = cadastrar_livro()
    emprestar(ocupado, cadastrar_leitor())

    disponiveis = api.get("/livros", params={"disponivel": "true"}).json()
    indisponiveis = api.get("/livros", params={"disponivel": "false"}).json()

    assert [livro["id"] for livro in disponiveis] == [livre["id"]]
    assert [livro["id"] for livro in indisponiveis] == [ocupado["id"]]
    assert indisponiveis[0]["emprestados"] == 1


def test_put_substitui_todos_os_campos(api, cadastrar_livro):
    livro = cadastrar_livro()

    resposta = api.put(f"/livros/{livro['id']}", json=LIVRO | {"exemplares": 5})

    assert resposta.status_code == 200
    assert resposta.json()["titulo"] == "Sistemas Distribuídos"
    assert resposta.json()["exemplares"] == 5


def test_patch_altera_so_os_campos_enviados(api, cadastrar_livro):
    livro = cadastrar_livro(autor="Original")

    resposta = api.patch(f"/livros/{livro['id']}", json={"titulo": "Novo título"})

    assert resposta.status_code == 200
    assert resposta.json()["titulo"] == "Novo título"
    assert resposta.json()["autor"] == "Original"


def test_exclui_livro_sem_historico(api, cadastrar_livro):
    livro = cadastrar_livro()

    resposta = api.delete(f"/livros/{livro['id']}")

    assert resposta.status_code == 204
    assert resposta.content == b""
    assert api.get(f"/livros/{livro['id']}").status_code == 404


@pytest.mark.parametrize(
    ("metodo", "corpo"),
    [("get", None), ("put", LIVRO), ("patch", {"titulo": "X"}), ("delete", None)],
)
def test_livro_inexistente_responde_404(api, metodo, corpo):
    argumentos = {"json": corpo} if corpo is not None else {}

    resposta = api.request(metodo.upper(), "/livros/999999", **argumentos)

    assert resposta.status_code == 404
    assert resposta.json() == {"detail": "Livro não encontrado."}


@pytest.mark.parametrize(
    "campos",
    [
        {"isbn": "123"},
        {"isbn": "97885760514X8"},
        {"titulo": "   "},
        {"autor": ""},
        {"ano": 1449},
        {"ano": 3000},
        {"exemplares": 0},
        {"exemplares": 2_147_483_648},
    ],
    ids=[
        "isbn-curto",
        "isbn-com-letra",
        "titulo-so-espacos",
        "autor-vazio",
        "ano-1449",
        "ano-futuro",
        "zero-exemplares",
        "exemplares-acima-do-integer",
    ],
)
def test_dados_invalidos_respondem_422(api, campos):
    assert api.post("/livros", json=LIVRO | campos).status_code == 422


@pytest.mark.parametrize("livro_id", ["0", "2147483648", "abc"])
def test_id_fora_da_faixa_do_banco_responde_422(api, livro_id):
    # Sem esse limite o PostgreSQL recusaria o número e a API responderia 500
    assert api.get(f"/livros/{livro_id}").status_code == 422


def test_patch_com_null_responde_422(api, cadastrar_livro):
    livro = cadastrar_livro()

    assert api.patch(f"/livros/{livro['id']}", json={"titulo": None}).status_code == 422


def test_isbn_duplicado_responde_409_mesmo_com_hifen(api, cadastrar_livro):
    cadastrar_livro(isbn="9788576051428")

    resposta = api.post("/livros", json=LIVRO)

    assert resposta.status_code == 409
    assert "ISBN" in resposta.json()["detail"]


def test_conflito_barrado_pelo_banco_vira_409(api, cadastrar_livro, monkeypatch):
    # Simula duas requisições simultâneas: a conferência do service passa nas duas e
    # quem barra a segunda é o índice único do banco
    monkeypatch.setattr(livro_service, "_garantir_isbn_livre", lambda *args, **kwargs: None)
    cadastrar_livro(isbn="9788576051428")

    resposta = api.post("/livros", json=LIVRO)

    assert resposta.status_code == 409
    assert "Atualize e tente de novo" in resposta.json()["detail"]


def test_trocar_para_isbn_de_outro_livro_responde_409(api, cadastrar_livro):
    cadastrar_livro(isbn="9788576051428")
    outro = cadastrar_livro()

    resposta = api.patch(f"/livros/{outro['id']}", json={"isbn": "978-85-7605-142-8"})

    assert resposta.status_code == 409


def test_manter_o_proprio_isbn_no_put_e_aceito(api, cadastrar_livro):
    livro = cadastrar_livro(isbn="9788576051428")

    assert api.put(f"/livros/{livro['id']}", json=LIVRO).status_code == 200


def test_diminuir_exemplares_abaixo_dos_emprestados_responde_409(
    api, cadastrar_livro, cadastrar_leitor, emprestar
):
    livro = cadastrar_livro(exemplares=2)
    emprestar(livro, cadastrar_leitor())
    emprestar(livro, cadastrar_leitor())

    resposta = api.patch(f"/livros/{livro['id']}", json={"exemplares": 1})

    assert resposta.status_code == 409
    assert "2 exemplares" in resposta.json()["detail"]


def test_excluir_livro_com_historico_responde_409(
    api, cadastrar_livro, cadastrar_leitor, emprestar
):
    livro = cadastrar_livro()
    emprestimo = emprestar(livro, cadastrar_leitor())
    api.post(f"/emprestimos/{emprestimo['id']}/devolucao")

    resposta = api.delete(f"/livros/{livro['id']}")

    assert resposta.status_code == 409
    assert "histórico" in resposta.json()["detail"]
