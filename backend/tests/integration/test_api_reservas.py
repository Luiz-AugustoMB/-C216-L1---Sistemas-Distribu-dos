def reservas_do_livro(api, livro):
    return {
        reserva["leitor"]["id"]: reserva
        for reserva in api.get("/reservas", params={"livro_id": livro["id"]}).json()
    }


def test_fluxo_completo_da_fila(
    api, relogio, cadastrar_livro, cadastrar_leitor, emprestar, reservar
):
    livro = cadastrar_livro(exemplares=1)
    ana, bruno, carla = cadastrar_leitor(), cadastrar_leitor(), cadastrar_leitor()

    # Ana leva o único exemplar; Bruno e Carla entram na fila, nessa ordem
    emprestimo_ana = emprestar(livro, ana)
    reserva_bruno = reservar(livro, bruno)
    reserva_carla = reservar(livro, carla)
    assert (reserva_bruno["status"], reserva_bruno["posicao_na_fila"]) == ("na_fila", 1)
    assert (reserva_carla["status"], reserva_carla["posicao_na_fila"]) == ("na_fila", 2)
    assert api.get(f"/livros/{livro['id']}").json()["tamanho_fila"] == 2

    # A devolução da Ana separa o exemplar para o Bruno, com 2 dias para retirar
    relogio.avancar(3)
    api.post(f"/emprestimos/{emprestimo_ana['id']}/devolucao")
    reservas = reservas_do_livro(api, livro)
    assert reservas[bruno["id"]]["status"] == "aguardando_retirada"
    assert reservas[bruno["id"]]["expira_em"] == "2026-03-07"
    assert reservas[bruno["id"]]["separada_em"] is not None
    assert reservas[bruno["id"]]["posicao_na_fila"] is None
    assert reservas[carla["id"]]["posicao_na_fila"] == 1
    livro_agora = api.get(f"/livros/{livro['id']}").json()
    assert (livro_agora["disponiveis"], livro_agora["separados_para_reserva"]) == (0, 1)

    # O exemplar está guardado para o Bruno: a Carla não consegue emprestar
    tentativa = api.post("/emprestimos", json={"livro_id": livro["id"], "leitor_id": carla["id"]})
    assert tentativa.status_code == 409

    # No último dia do prazo a reserva ainda vale; no dia seguinte expira e passa para a Carla
    relogio.avancar(2)
    assert reservas_do_livro(api, livro)[bruno["id"]]["status"] == "aguardando_retirada"
    relogio.avancar(1)
    reservas = reservas_do_livro(api, livro)
    assert reservas[bruno["id"]]["status"] == "expirada"
    assert reservas[carla["id"]]["status"] == "aguardando_retirada"
    assert reservas[carla["id"]]["expira_em"] == "2026-03-10"

    # A Carla retira o exemplar separado e a reserva dela fica concluída
    emprestimo_carla = emprestar(livro, carla)
    assert emprestimo_carla["data_emprestimo"] == "2026-03-08"
    assert reservas_do_livro(api, livro)[carla["id"]]["status"] == "concluida"
    livro_final = api.get(f"/livros/{livro['id']}").json()
    assert (livro_final["emprestados"], livro_final["separados_para_reserva"]) == (1, 0)
    assert livro_final["tamanho_fila"] == 0


def test_reserva_expirada_sem_fila_libera_o_exemplar(
    api, relogio, cadastrar_livro, cadastrar_leitor, emprestar, reservar
):
    livro = cadastrar_livro()
    emprestimo = emprestar(livro, cadastrar_leitor())
    reserva = reservar(livro, cadastrar_leitor())
    api.post(f"/emprestimos/{emprestimo['id']}/devolucao")
    assert api.get(f"/livros/{livro['id']}").json()["disponiveis"] == 0

    relogio.avancar(3)

    assert api.get(f"/livros/{livro['id']}").json()["disponiveis"] == 1
    reservas = api.get("/reservas", params={"livro_id": livro["id"]}).json()
    assert [(r["id"], r["status"]) for r in reservas] == [(reserva["id"], "expirada")]


def test_renovacao_bloqueada_quando_ha_fila(
    api, cadastrar_livro, cadastrar_leitor, emprestar, reservar
):
    livro = cadastrar_livro()
    emprestimo = emprestar(livro, cadastrar_leitor())
    reservar(livro, cadastrar_leitor())

    resposta = api.post(f"/emprestimos/{emprestimo['id']}/renovacao")

    assert resposta.status_code == 409
    assert "fila de reserva" in resposta.json()["detail"]


def test_cancelar_reserva_separada_promove_o_proximo(
    api, cadastrar_livro, cadastrar_leitor, emprestar, reservar
):
    livro = cadastrar_livro()
    ana, bruno, carla = cadastrar_leitor(), cadastrar_leitor(), cadastrar_leitor()
    emprestimo = emprestar(livro, ana)
    reserva_bruno = reservar(livro, bruno)
    reservar(livro, carla)
    api.post(f"/emprestimos/{emprestimo['id']}/devolucao")

    resposta = api.delete(f"/reservas/{reserva_bruno['id']}")

    assert resposta.status_code == 204
    reservas = reservas_do_livro(api, livro)
    assert reservas[bruno["id"]]["status"] == "cancelada"
    assert reservas[carla["id"]]["status"] == "aguardando_retirada"


def test_cancelar_ultima_reserva_separada_libera_o_exemplar(
    api, cadastrar_livro, cadastrar_leitor, emprestar, reservar
):
    livro = cadastrar_livro()
    emprestimo = emprestar(livro, cadastrar_leitor())
    reserva = reservar(livro, cadastrar_leitor())
    api.post(f"/emprestimos/{emprestimo['id']}/devolucao")

    api.delete(f"/reservas/{reserva['id']}")

    assert api.get(f"/livros/{livro['id']}").json()["disponiveis"] == 1


def test_aumentar_exemplares_promove_a_fila(
    api, cadastrar_livro, cadastrar_leitor, emprestar, reservar
):
    livro = cadastrar_livro(exemplares=1)
    emprestar(livro, cadastrar_leitor())
    bruno, carla, davi = cadastrar_leitor(), cadastrar_leitor(), cadastrar_leitor()
    for leitor in (bruno, carla, davi):
        reservar(livro, leitor)

    resposta = api.patch(f"/livros/{livro['id']}", json={"exemplares": 3})

    assert resposta.status_code == 200
    assert (resposta.json()["separados_para_reserva"], resposta.json()["tamanho_fila"]) == (2, 1)
    reservas = reservas_do_livro(api, livro)
    assert reservas[bruno["id"]]["status"] == "aguardando_retirada"
    assert reservas[carla["id"]]["status"] == "aguardando_retirada"
    assert (reservas[davi["id"]]["status"], reservas[davi["id"]]["posicao_na_fila"]) == (
        "na_fila",
        1,
    )


def test_nao_reserva_livro_com_exemplar_disponivel(api, cadastrar_livro, cadastrar_leitor):
    livro, leitor = cadastrar_livro(), cadastrar_leitor()

    resposta = api.post("/reservas", json={"livro_id": livro["id"], "leitor_id": leitor["id"]})

    assert resposta.status_code == 409
    assert "empréstimo direto" in resposta.json()["detail"]


def test_nao_reserva_livro_que_o_leitor_ja_esta_lendo(
    api, cadastrar_livro, cadastrar_leitor, emprestar
):
    livro, leitor = cadastrar_livro(), cadastrar_leitor()
    emprestar(livro, leitor)

    resposta = api.post("/reservas", json={"livro_id": livro["id"], "leitor_id": leitor["id"]})

    assert resposta.status_code == 409
    assert resposta.json()["detail"] == "O leitor já está com este livro."


def test_nao_reserva_duas_vezes_o_mesmo_livro(
    api, cadastrar_livro, cadastrar_leitor, emprestar, reservar
):
    livro, leitor = cadastrar_livro(), cadastrar_leitor()
    emprestar(livro, cadastrar_leitor())
    reservar(livro, leitor)

    resposta = api.post("/reservas", json={"livro_id": livro["id"], "leitor_id": leitor["id"]})

    assert resposta.status_code == 409
    assert "reserva aberta" in resposta.json()["detail"]


def test_reserva_com_livro_ou_leitor_inexistente_responde_404(api, cadastrar_livro):
    livro = cadastrar_livro()

    assert api.post("/reservas", json={"livro_id": 999999, "leitor_id": 1}).status_code == 404
    resposta = api.post("/reservas", json={"livro_id": livro["id"], "leitor_id": 999999})
    assert resposta.status_code == 404


def test_cancelar_reserva_encerrada_ou_inexistente(
    api, cadastrar_livro, cadastrar_leitor, emprestar, reservar
):
    livro = cadastrar_livro()
    emprestar(livro, cadastrar_leitor())
    reserva = reservar(livro, cadastrar_leitor())
    api.delete(f"/reservas/{reserva['id']}")

    de_novo = api.delete(f"/reservas/{reserva['id']}")

    assert de_novo.status_code == 409
    assert "encerrada" in de_novo.json()["detail"]
    assert api.delete("/reservas/999999").status_code == 404


def test_filtra_reservas_por_status_e_leitor(
    api, cadastrar_livro, cadastrar_leitor, emprestar, reservar
):
    livro = cadastrar_livro()
    emprestar(livro, cadastrar_leitor())
    ana, bruno = cadastrar_leitor(), cadastrar_leitor()
    reserva_ana = reservar(livro, ana)
    reserva_bruno = reservar(livro, bruno)
    api.delete(f"/reservas/{reserva_ana['id']}")

    na_fila = api.get("/reservas", params={"status": "na_fila"}).json()
    da_ana = api.get("/reservas", params={"leitor_id": ana["id"]}).json()

    assert [(r["id"], r["posicao_na_fila"]) for r in na_fila] == [(reserva_bruno["id"], 1)]
    assert [(r["id"], r["status"]) for r in da_ana] == [(reserva_ana["id"], "cancelada")]
