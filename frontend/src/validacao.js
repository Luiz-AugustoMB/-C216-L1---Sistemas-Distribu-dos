// Espelha as validações da API para avisar antes de enviar. A API continua sendo quem
// decide: o que passar daqui e ela recusar aparece como mensagem de erro

export const ANO_MINIMO = 1450;

function vazio(valor) {
	return String(valor ?? "").trim() === "";
}

export function normalizarIsbn(isbn) {
	return String(isbn ?? "").replace(/[-\s]/g, "");
}

export function isbnValido(isbn) {
	return /^(\d{10}|\d{13})$/.test(normalizarIsbn(isbn));
}

export function emailValido(email) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? "").trim());
}

function inteiro(valor) {
	return /^\d+$/.test(String(valor ?? "").trim()) ? Number(valor) : null;
}

export function validarLivro(livro, anoAtual = new Date().getFullYear()) {
	const erros = {};
	if (vazio(livro.titulo)) erros.titulo = "Informe o título.";
	if (vazio(livro.autor)) erros.autor = "Informe o autor.";
	if (vazio(livro.isbn)) {
		erros.isbn = "Informe o ISBN.";
	} else if (!isbnValido(livro.isbn)) {
		erros.isbn = "O ISBN deve ter 10 ou 13 dígitos, com ou sem hífen.";
	}

	const ano = inteiro(livro.ano);
	if (ano === null || ano < ANO_MINIMO || ano > anoAtual + 1) {
		erros.ano = `O ano deve estar entre ${ANO_MINIMO} e ${anoAtual + 1}.`;
	}
	const exemplares = inteiro(livro.exemplares);
	if (exemplares === null || exemplares < 1) {
		erros.exemplares = "Informe pelo menos 1 exemplar.";
	}
	return erros;
}

export function validarLeitor(leitor) {
	const erros = {};
	if (vazio(leitor.nome)) erros.nome = "Informe o nome.";
	if (vazio(leitor.email)) {
		erros.email = "Informe o e-mail.";
	} else if (!emailValido(leitor.email)) {
		erros.email = "Informe um e-mail válido.";
	}
	return erros;
}
