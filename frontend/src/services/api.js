export class ApiError extends Error {
	constructor(mensagem, status) {
		super(mensagem);
		this.name = "ApiError";
		this.status = status;
	}
}

// O FastAPI devolve "detail" como texto (404, 503) ou como lista de erros de
// validação (422), e um erro fora da aplicação pode nem ser JSON
async function lerMensagemDeErro(resposta) {
	const generica = `A API respondeu com erro ${resposta.status}.`;

	let detail;
	try {
		({ detail } = await resposta.json());
	} catch {
		return generica;
	}

	if (Array.isArray(detail)) {
		return detail
			.map(({ loc, msg }) =>
				// loc termina no campo inválido; só ["body"] indica erro no corpo inteiro
				loc?.length > 1 ? `${loc.at(-1)}: ${msg}` : msg,
			)
			.join("; ");
	}
	return detail || generica;
}

export async function request(caminho, { method = "GET", body } = {}) {
	// Sem valor padrão no código: a URL vem só do ambiente (Makefile, .env ou build arg)
	const apiUrl = import.meta.env.VITE_API_URL;
	if (!apiUrl) {
		throw new ApiError(
			"VITE_API_URL não foi definida. Rode o frontend pelo make ou pelo Docker.",
		);
	}

	const opcoes = { method };
	if (body !== undefined) {
		opcoes.headers = { "Content-Type": "application/json" };
		opcoes.body = JSON.stringify(body);
	}

	// Cenário 1: o fetch só rejeita quando não há resposta (API fora do ar, CORS)
	let resposta;
	try {
		resposta = await fetch(`${apiUrl}${caminho}`, opcoes);
	} catch {
		throw new ApiError(
			"Não foi possível conectar à API. Verifique se o backend está no ar.",
		);
	}

	// Cenário 2: houve resposta, mas com status de erro
	if (!resposta.ok) {
		throw new ApiError(await lerMensagemDeErro(resposta), resposta.status);
	}

	// Cenário 3: sucesso; o DELETE responde 204, sem corpo para converter
	if (resposta.status === 204) {
		return null;
	}
	// Um proxy ou uma VITE_API_URL errada podem responder 200 com HTML
	try {
		return await resposta.json();
	} catch {
		throw new ApiError(
			"A API respondeu em um formato inesperado.",
			resposta.status,
		);
	}
}
