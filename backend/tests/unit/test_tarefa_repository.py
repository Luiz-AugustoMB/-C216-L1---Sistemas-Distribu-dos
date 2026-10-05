from schemas.tarefa import TarefaCreate, TarefaUpdate


def test_repositorio_inicia_vazio(repo):
    assert repo.listar() == []


def test_criar_atribui_ids_sequenciais(repo):
    t1 = repo.criar(TarefaCreate(titulo="A"))
    t2 = repo.criar(TarefaCreate(titulo="B"))
    assert (t1.id, t2.id) == (1, 2)


def test_criar_usa_valores_padrao(repo):
    tarefa = repo.criar(TarefaCreate(titulo="A"))
    assert tarefa.descricao is None
    assert tarefa.concluida is False


def test_ids_nao_sao_reutilizados_apos_remocao(repo):
    t1 = repo.criar(TarefaCreate(titulo="A"))
    repo.remover(t1.id)
    t2 = repo.criar(TarefaCreate(titulo="B"))
    assert t2.id == 2


def test_listar_filtra_por_concluida(repo):
    repo.criar(TarefaCreate(titulo="A", concluida=True))
    repo.criar(TarefaCreate(titulo="B"))
    assert [t.titulo for t in repo.listar(concluida=True)] == ["A"]
    assert [t.titulo for t in repo.listar(concluida=False)] == ["B"]
    assert len(repo.listar()) == 2


def test_buscar_inexistente_retorna_none(repo):
    assert repo.buscar(99) is None


def test_substituir_troca_todos_os_campos(repo):
    tarefa = repo.criar(TarefaCreate(titulo="A", descricao="x", concluida=True))
    nova = repo.substituir(tarefa.id, TarefaCreate(titulo="B"))
    assert nova.model_dump() == {
        "id": tarefa.id,
        "titulo": "B",
        "descricao": None,
        "concluida": False,
    }


def test_substituir_inexistente_retorna_none(repo):
    assert repo.substituir(99, TarefaCreate(titulo="A")) is None


def test_atualizar_parcial_altera_apenas_campos_enviados(repo):
    tarefa = repo.criar(TarefaCreate(titulo="A", descricao="x"))
    atualizada = repo.atualizar_parcial(tarefa.id, TarefaUpdate(concluida=True))
    assert atualizada.titulo == "A"
    assert atualizada.descricao == "x"
    assert atualizada.concluida is True


def test_atualizar_parcial_permite_limpar_descricao(repo):
    tarefa = repo.criar(TarefaCreate(titulo="A", descricao="x"))
    atualizada = repo.atualizar_parcial(tarefa.id, TarefaUpdate(descricao=None))
    assert atualizada.descricao is None


def test_atualizar_parcial_inexistente_retorna_none(repo):
    assert repo.atualizar_parcial(99, TarefaUpdate(titulo="B")) is None


def test_remover(repo):
    tarefa = repo.criar(TarefaCreate(titulo="A"))
    assert repo.remover(tarefa.id) is True
    assert repo.buscar(tarefa.id) is None


def test_remover_inexistente_retorna_false(repo):
    assert repo.remover(99) is False
