from app.models.tarefa import Tarefa
from app.repositories.tarefa_repository import TarefaRepository


def test_salvar_atribui_id_e_valores_padrao_do_banco(db):
    tarefa = TarefaRepository(db).salvar(Tarefa(titulo="A"))
    assert tarefa.id is not None
    assert tarefa.descricao is None
    assert tarefa.concluida is False


def test_listar_ordena_por_id_e_filtra_por_concluida(db):
    repo = TarefaRepository(db)
    repo.salvar(Tarefa(titulo="A", concluida=True))
    repo.salvar(Tarefa(titulo="B"))
    assert [t.titulo for t in repo.listar()] == ["A", "B"]
    assert [t.titulo for t in repo.listar(concluida=True)] == ["A"]
    assert [t.titulo for t in repo.listar(concluida=False)] == ["B"]


def test_buscar_inexistente_retorna_none(db):
    assert TarefaRepository(db).buscar(99) is None


def test_remover_apaga_do_banco(db):
    repo = TarefaRepository(db)
    tarefa = repo.salvar(Tarefa(titulo="A"))
    repo.remover(tarefa)
    assert repo.buscar(tarefa.id) is None


def test_dados_persistem_entre_sessoes(session_factory):
    # Simula duas requisições distintas: o dado gravado na primeira sessão
    # precisa ser lido pela segunda, ou seja, está no banco e não em memória
    with session_factory() as sessao:
        tarefa_id = TarefaRepository(sessao).salvar(Tarefa(titulo="Persistente")).id

    with session_factory() as nova_sessao:
        tarefa = TarefaRepository(nova_sessao).buscar(tarefa_id)
        assert tarefa is not None
        assert tarefa.titulo == "Persistente"
