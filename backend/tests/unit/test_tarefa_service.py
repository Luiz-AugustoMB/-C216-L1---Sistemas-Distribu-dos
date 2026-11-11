import pytest

from app.schemas.tarefa import TarefaCreate, TarefaUpdate
from app.services.tarefa_service import TarefaNaoEncontradaError


def _campos(tarefa):
    return {
        "id": tarefa.id,
        "titulo": tarefa.titulo,
        "descricao": tarefa.descricao,
        "concluida": tarefa.concluida,
    }


def test_listar_inicia_vazio(service):
    assert service.listar() == []


def test_criar_persiste_pelo_repository(service, repo):
    tarefa = service.criar(TarefaCreate(titulo="A"))
    assert repo.buscar(tarefa.id) is tarefa


def test_criar_usa_valores_padrao(service):
    tarefa = service.criar(TarefaCreate(titulo="A"))
    assert tarefa.descricao is None
    assert tarefa.concluida is False


def test_listar_repassa_filtro_concluida(service):
    service.criar(TarefaCreate(titulo="A", concluida=True))
    service.criar(TarefaCreate(titulo="B"))
    assert [t.titulo for t in service.listar(concluida=True)] == ["A"]
    assert [t.titulo for t in service.listar(concluida=False)] == ["B"]
    assert len(service.listar()) == 2


def test_buscar_existente(service):
    tarefa = service.criar(TarefaCreate(titulo="A"))
    assert service.buscar(tarefa.id) is tarefa


def test_substituir_troca_todos_os_campos(service):
    tarefa = service.criar(TarefaCreate(titulo="A", descricao="x", concluida=True))
    nova = service.substituir(tarefa.id, TarefaCreate(titulo="B"))
    assert _campos(nova) == {
        "id": tarefa.id,
        "titulo": "B",
        "descricao": None,
        "concluida": False,
    }


def test_atualizar_parcial_altera_apenas_campos_enviados(service):
    tarefa = service.criar(TarefaCreate(titulo="A", descricao="x"))
    atualizada = service.atualizar_parcial(tarefa.id, TarefaUpdate(concluida=True))
    assert atualizada.titulo == "A"
    assert atualizada.descricao == "x"
    assert atualizada.concluida is True


def test_atualizar_parcial_permite_limpar_descricao(service):
    tarefa = service.criar(TarefaCreate(titulo="A", descricao="x"))
    atualizada = service.atualizar_parcial(tarefa.id, TarefaUpdate(descricao=None))
    assert atualizada.descricao is None


def test_atualizar_parcial_corpo_vazio_nao_altera(service):
    tarefa = service.criar(TarefaCreate(titulo="A", descricao="x"))
    antes = _campos(tarefa)
    assert _campos(service.atualizar_parcial(tarefa.id, TarefaUpdate())) == antes


def test_remover(service, repo):
    tarefa = service.criar(TarefaCreate(titulo="A"))
    service.remover(tarefa.id)
    assert repo.buscar(tarefa.id) is None


@pytest.mark.parametrize(
    ("operacao", "args"),
    [
        ("buscar", ()),
        ("substituir", (TarefaCreate(titulo="A"),)),
        ("atualizar_parcial", (TarefaUpdate(titulo="B"),)),
        ("remover", ()),
    ],
)
def test_operacoes_em_tarefa_inexistente_lancam_erro(service, operacao, args):
    with pytest.raises(TarefaNaoEncontradaError):
        getattr(service, operacao)(99, *args)
