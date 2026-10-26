// Mesmos limites do TarefaBase no backend (backend/app/schemas/tarefa.py)
export const TITULO_MAX = 100;
export const DESCRICAO_MAX = 500;

// Conta caracteres como o Pydantic: .length conta unidades UTF-16, e um
// emoji como "🚀" valeria 2 em vez de 1
export function contarCaracteres(texto = "") {
	return [...texto.trim()].length;
}

export function validarTitulo(titulo = "") {
	const tamanho = contarCaracteres(titulo);
	if (tamanho === 0) {
		return "O título é obrigatório.";
	}
	if (tamanho > TITULO_MAX) {
		return `O título deve ter no máximo ${TITULO_MAX} caracteres.`;
	}
	return null;
}

export function validarDescricao(descricao = "") {
	if (contarCaracteres(descricao) > DESCRICAO_MAX) {
		return `A descrição deve ter no máximo ${DESCRICAO_MAX} caracteres.`;
	}
	return null;
}

// Retorna um objeto { campo: mensagem } só com os campos inválidos
export function validarTarefa({ titulo, descricao }) {
	const erros = {};

	const erroTitulo = validarTitulo(titulo);
	if (erroTitulo) {
		erros.titulo = erroTitulo;
	}

	const erroDescricao = validarDescricao(descricao);
	if (erroDescricao) {
		erros.descricao = erroDescricao;
	}

	return erros;
}

export function temErros(erros) {
	return Object.keys(erros).length > 0;
}
