export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export class ErroApi extends Error {
	constructor(mensagem, status) {
		super(mensagem);
		this.name = "ErroApi";
		// 0 quando nem chegou resposta (API fora do ar ou bloqueada)
		this.status = status;
	}
}

const MENSAGENS_POR_STATUS = {
	400: "A requisição não pôde ser processada.",
	404: "Registro não encontrado.",
	409: "A operação não pôde ser feita.",
	422: "Os dados enviados são inválidos.",
	500: "Erro interno na API. Tente de novo em instantes.",
};

function montarUrl(caminho, params) {
	// Concatena em vez de new URL(caminho, base): com a base "http://host/api", o caminho
	// "/livros" apagaria o "/api"
	const url = new URL(API_URL.replace(/\/+$/, "") + caminho);
	for (const [nome, valor] of Object.entries(params ?? {})) {
		// Filtro vazio não vai na URL, para a API não receber "busca=" ou "status="
		if (valor !== undefined && valor !== null && valor !== "") {
			url.searchParams.set(nome, valor);
		}
	}
	return url.toString();
}

function mensagemDoCorpo(corpo, status) {
	const detail = corpo?.detail;
	if (typeof detail === "string") {
		return detail;
	}
	// 422 do FastAPI: lista de erros de validação, um por campo
	if (Array.isArray(detail) && detail.length > 0) {
		return detail
			.map((erro) => String(erro.msg ?? "").replace(/^Value error, /, ""))
			.join(" ");
	}
	return MENSAGENS_POR_STATUS[status] ?? `A API respondeu com erro ${status}.`;
}

async function lerJson(resposta) {
	try {
		return await resposta.json();
	} catch {
		return null;
	}
}

export async function request(caminho, { method = "GET", body, params } = {}) {
	const opcoes = { method };
	if (body !== undefined) {
		opcoes.headers = { "Content-Type": "application/json" };
		opcoes.body = JSON.stringify(body);
	}

	let resposta;
	try {
		resposta = await fetch(montarUrl(caminho, params), opcoes);
	} catch {
		throw new ErroApi(
			"Não foi possível conectar à API. Confira se o backend está no ar.",
			0,
		);
	}

	if (resposta.status === 204) {
		return null;
	}
	const corpo = await lerJson(resposta);
	if (!resposta.ok) {
		throw new ErroApi(mensagemDoCorpo(corpo, resposta.status), resposta.status);
	}
	return corpo;
}
