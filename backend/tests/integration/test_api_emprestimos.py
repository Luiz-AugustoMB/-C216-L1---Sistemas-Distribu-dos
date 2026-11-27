import pytest


def test_cria_emprestimo_com_prazo_de_14_dias(api, cadastrar_livro, cadastrar_leitor):
    livro, leitor = cadastrar_livro(exemplares=2), cadastrar_leitor()

    resposta = api.post("/emprestimos", json={"livro_id": livro["id"], "leitor_id": leitor["id"]})

    assert resposta.status_code == 201
    emprestimo = resposta.json()
    assert emprestimo["livro"] == {"id": livro["id"], "titulo": livro["titulo"]}
    assert emprestimo["leitor"] == {"id": leitor["id"], "nome": leitor["nome"]}
    assert emprestimo["data_emprestimo"] == "2026-03-02"
    assert emprestimo["data_prevista"] == "2026-03-16"
    assert emprestimo["data_devolucao"] is None
    assert emprestimo["status"] == "ativo"
    assert emprestimo["dias_atraso"] == 0
    assert api.get(f"/livros/{livro['id']}").json()["disponiveis"] == 1


def test_livro_ou_leitor_inexistente_responde_404(api, cadastrar_livro, cadastrar_leitor):
    livro, leitor = cadastrar_livro(), cadastrar_leitor()

    sem_livro = api.post("/emprestimos", json={"livro_id": 999999, "leitor_id": leitor["id"]})
    sem_leitor = api.post("/emprestimos", json={"livro_id": livro["id"], "leitor_id": 999999})

    assert sem_livro.status_code == 404
    assert sem_livro.json()["detail"] == "Livro não encontrado."
    assert sem_leitor.status_code == 404
    assert sem_leitor.json()["detail"] == "Leitor não encontrado."


@pytest.mark.parametrize(
    ("metodo", "caminho"),
    [
        ("GET", "/emprestimos/999999"),
        ("POST", "/emprestimos/999999/devolucao"),
        ("POST", "/emprestimos/999999/renovacao"),
    ],
)
def test_emprestimo_inexistente_responde_404(api, metodo, caminho):
    resposta = api.request(metodo, caminho)

    assert resposta.status_code == 404
    assert resposta.json() == {"detail": "Empréstimo não encontrado."}


def test_corpo_incompleto_responde_422(api):
    assert api.post("/emprestimos", json={"livro_id": 1}).status_code == 422


def test_ids_fora_da_faixa_do_banco_respondem_422(api):
    grande = 2_147_483_648

    assert api.post("/emprestimos", json={"livro_id": grande, "leitor_id": 1}).status_code == 422
    assert api.get("/emprestimos", params={"leitor_id": grande}).status_code == 422
    assert api.post(f"/emprestimos/{grande}/devolucao").status_code == 422


def test_leitor_com_atraso_nao_pega_outro_livro(
    api, relogio, cadastrar_livro, cadastrar_leitor, emprestar
):
    leitor = cadastrar_leitor()
    emprestar(cadastrar_livro(), leitor)
    outro = cadastrar_livro()
    relogio.avancar(15)

    resposta = api.post("/emprestimos", json={"livro_id": outro["id"], "leitor_id": leitor["id"]})

    assert resposta.status_code == 409
    assert "atrasado" in resposta.json()["detail"]


def test_leitor_no_limite_de_emprestimos_ativos(api, cadastrar_livro, cadastrar_leitor, emprestar):
    leitor = cadastrar_leitor()
    for _ in range(3):
        emprestar(cadastrar_livro(), leitor)
    quarto = cadastrar_livro()

    resposta = api.post("/emprestimos", json={"livro_id": quarto["id"], "leitor_id": leitor["id"]})

    assert resposta.status_code == 409
    assert resposta.json()["detail"] == "O leitor já tem 3 empréstimos ativos."


def test_leitor_que_ja_esta_com_o_livro(api, cadastrar_livro, cadastrar_leitor, emprestar):
    livro, leitor = cadastrar_livro(exemplares=2), cadastrar_leitor()
    emprestar(livro, leitor)

    resposta = api.post("/emprestimos", json={"livro_id": livro["id"], "leitor_id": leitor["id"]})

    assert resposta.status_code == 409
    assert resposta.json()["detail"] == "O leitor já está com este livro."


def test_sem_exemplar_disponivel_sugere_a_fila(api, cadastrar_livro, cadastrar_leitor, emprestar):
    livro = cadastrar_livro(titulo="Redes")
    emprestar(livro, cadastrar_leitor())
    leitor = cadastrar_leitor()

    resposta = api.post("/emprestimos", json={"livro_id": livro["id"], "leitor_id": leitor["id"]})

    assert resposta.status_code == 409
    assert resposta.json()["detail"] == (
        'Não há exemplar disponível de "Redes". O leitor pode entrar na fila de reserva.'
    )


def test_status_muda_com_o_relogio_e_devolucao_guarda_o_atraso(
    api, relogio, cadastrar_livro, cadastrar_leitor, emprestar
):
    emprestimo = emprestar(cadastrar_livro(), cadastrar_leitor())
    caminho = f"/emprestimos/{emprestimo['id']}"

    relogio.avancar(14)
    no_dia = api.get(caminho).json()
    relogio.avancar(1)
    dia_seguinte = api.get(caminho).json()
    relogio.avancar(2)
    devolvido = api.post(f"{caminho}/devolucao").json()
    relogio.avancar(10)
    depois = api.get(caminho).json()

    assert (no_dia["status"], no_dia["dias_atraso"]) == ("ativo", 0)
    assert (dia_seguinte["status"], dia_seguinte["dias_atraso"]) == ("atrasado", 1)
    assert devolvido["data_devolucao"] == "2026-03-19"
    assert (devolvido["status"], devolvido["dias_atraso"]) == ("devolvido", 3)
    assert (depois["status"], depois["dias_atraso"]) == ("devolvido", 3)


def test_devolucao_libera_o_exemplar_e_nao_pode_repetir(
    api, cadastrar_livro, cadastrar_leitor, emprestar
):
    livro = cadastrar_livro()
    emprestimo = emprestar(livro, cadastrar_leitor())

    primeira = api.post(f"/emprestimos/{emprestimo['id']}/devolucao")
    segunda = api.post(f"/emprestimos/{emprestimo['id']}/devolucao")

    assert primeira.status_code == 200
    assert api.get(f"/livros/{livro['id']}").json()["disponiveis"] == 1
    assert segunda.status_code == 409
    assert segunda.json()["detail"] == "Este empréstimo já foi devolvido."


def test_renova_ate_o_maximo(api, cadastrar_livro, cadastrar_leitor, emprestar):
    emprestimo = emprestar(cadastrar_livro(), cadastrar_leitor())
    caminho = f"/emprestimos/{emprestimo['id']}/renovacao"

    primeira = api.post(caminho)
    segunda = api.post(caminho)
    terceira = api.post(caminho)

    assert primeira.status_code == 200
    assert (primeira.json()["data_prevista"], primeira.json()["renovacoes"]) == ("2026-03-30", 1)
    assert (segunda.json()["data_prevista"], segunda.json()["renovacoes"]) == ("2026-04-13", 2)
    assert terceira.status_code == 409
    assert "máximo" in terceira.json()["detail"]


def test_nao_renova_atrasado_nem_devolvido(
    api, relogio, cadastrar_livro, cadastrar_leitor, emprestar
):
    atrasado = emprestar(cadastrar_livro(), cadastrar_leitor())
    devolvido = emprestar(cadastrar_livro(), cadastrar_leitor())
    api.post(f"/emprestimos/{devolvido['id']}/devolucao")
    relogio.avancar(15)

    resposta_atrasado = api.post(f"/emprestimos/{atrasado['id']}/renovacao")
    resposta_devolvido = api.post(f"/emprestimos/{devolvido['id']}/renovacao")

    assert resposta_atrasado.status_code == 409
    assert "atrasado" in resposta_atrasado.json()["detail"]
    assert resposta_devolvido.status_code == 409
    assert "devolvido" in resposta_devolvido.json()["detail"]


def test_filtra_emprestimos_por_status_livro_e_leitor(
    api, relogio, cadastrar_livro, cadastrar_leitor, emprestar
):
    ana, bruno = cadastrar_leitor(), cadastrar_leitor()
    redes, algoritmos = cadastrar_livro(), cadastrar_livro()
    antigo = emprestar(redes, ana)
    relogio.avancar(10)
    recente = emprestar(algoritmos, bruno)
    devolvido = emprestar(cadastrar_livro(), bruno)
    api.post(f"/emprestimos/{devolvido['id']}/devolucao")
    relogio.avancar(5)

    def ids(**filtros):
        return [item["id"] for item in api.get("/emprestimos", params=filtros).json()]

    assert ids(status="atrasado") == [antigo["id"]]
    assert ids(status="ativo") == [recente["id"]]
    assert ids(status="devolvido") == [devolvido["id"]]
    assert ids(livro_id=redes["id"]) == [antigo["id"]]
    assert set(ids(leitor_id=bruno["id"])) == {recente["id"], devolvido["id"]}
    assert api.get("/emprestimos", params={"status": "perdido"}).status_code == 422
