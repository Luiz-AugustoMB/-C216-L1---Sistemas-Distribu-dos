def test_painel_vazio(api):
    resposta = api.get("/painel")

    assert resposta.status_code == 200
    assert resposta.json() == {"emprestimos_atrasados": [], "livros_mais_emprestados": []}


def test_painel_mostra_atrasados_do_mais_atrasado_ao_menos(
    api, relogio, cadastrar_livro, cadastrar_leitor, emprestar
):
    ana, bruno, carla = cadastrar_leitor(), cadastrar_leitor(), cadastrar_leitor()
    mais_antigo = emprestar(cadastrar_livro(), ana)
    relogio.avancar(3)
    mais_novo = emprestar(cadastrar_livro(), bruno)
    relogio.avancar(10)
    emprestar(cadastrar_livro(), carla)
    relogio.avancar(5)

    atrasados = api.get("/painel").json()["emprestimos_atrasados"]

    assert [item["emprestimo_id"] for item in atrasados] == [mais_antigo["id"], mais_novo["id"]]
    assert [item["dias_atraso"] for item in atrasados] == [4, 1]
    assert atrasados[0]["leitor"] == {"id": ana["id"], "nome": ana["nome"]}
    assert atrasados[0]["data_prevista"] == "2026-03-16"


def test_painel_mostra_os_5_livros_mais_emprestados(
    api, cadastrar_livro, cadastrar_leitor, emprestar
):
    livros = [cadastrar_livro(titulo=f"Livro {letra}", exemplares=5) for letra in "ABCDEF"]
    leitores = [cadastrar_leitor() for _ in range(6)]
    # Livro A emprestado 6 vezes, B 5 vezes, ... F 1 vez (com devolução para liberar o leitor)
    for posicao, livro in enumerate(livros):
        for leitor in leitores[: 6 - posicao]:
            emprestimo = emprestar(livro, leitor)
            api.post(f"/emprestimos/{emprestimo['id']}/devolucao")

    ranking = api.get("/painel").json()["livros_mais_emprestados"]

    assert [(item["livro"]["titulo"], item["total_emprestimos"]) for item in ranking] == [
        ("Livro A", 6),
        ("Livro B", 5),
        ("Livro C", 4),
        ("Livro D", 3),
        ("Livro E", 2),
    ]
