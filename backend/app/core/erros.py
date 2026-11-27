class ErroDeDominio(Exception):
    """Erro com mensagem pronta para mostrar ao usuário final."""

    def __init__(self, mensagem: str) -> None:
        super().__init__(mensagem)
        self.mensagem = mensagem


class RecursoNaoEncontrado(ErroDeDominio):
    """Vira 404 na API."""


class RegraDeNegocioViolada(ErroDeDominio):
    """Vira 409 na API."""
