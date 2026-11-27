import { vi } from "vitest";

// Resposta no formato que o request usa: status, ok e json()
export function resposta(corpo, status = 200) {
	return {
		status,
		ok: status >= 200 && status < 300,
		json: async () => {
			if (corpo === undefined) {
				throw new SyntaxError("corpo vazio");
			}
			return corpo;
		},
	};
}

// Troca o fetch global por um que responde conforme o método e o caminho da URL.
// "rotas" é um objeto como { "GET /livros": corpo } ou { "POST /livros": () => resposta(...) }
export function simularApi(rotas) {
	const fetch = vi.fn(async (url, opcoes = {}) => {
		const { pathname } = new URL(url);
		const chave = `${opcoes.method ?? "GET"} ${pathname}`;
		if (!(chave in rotas)) {
			throw new Error(`Requisição não simulada: ${chave}`);
		}
		const saida = rotas[chave];
		if (typeof saida === "function") {
			return saida(url, opcoes);
		}
		// Uma resposta pronta (com status) vale como está; qualquer outro valor é o corpo de um 200
		return typeof saida?.json === "function" ? saida : resposta(saida);
	});
	vi.stubGlobal("fetch", fetch);
	return fetch;
}

// Corpo enviado na chamada de índice n do fetch, já convertido de JSON
export function corpoEnviado(fetch, indice) {
	return JSON.parse(fetch.mock.calls[indice][1].body);
}
