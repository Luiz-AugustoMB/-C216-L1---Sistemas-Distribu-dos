import { describe, expect, it, vi } from "vitest";
import { ErroApi, request } from "../../src/services/api";
import { resposta } from "../apoio";

// Recarrega o módulo com outra VITE_API_URL, porque a base é lida quando ele é importado
async function importarComBase(base) {
	vi.stubEnv("VITE_API_URL", base);
	vi.resetModules();
	try {
		return await import("../../src/services/api");
	} finally {
		vi.unstubAllEnvs();
	}
}

function fetchQueResponde(saida) {
	const fetch = vi.fn(async () => saida);
	vi.stubGlobal("fetch", fetch);
	return fetch;
}

describe("request", () => {
	it("devolve o JSON quando a resposta é ok", async () => {
		fetchQueResponde(resposta([{ id: 1 }]));

		await expect(request("/livros")).resolves.toEqual([{ id: 1 }]);
	});

	it("devolve null no 204, sem ler o corpo", async () => {
		const semCorpo = resposta(undefined, 204);
		fetchQueResponde(semCorpo);

		await expect(
			request("/livros/1", { method: "DELETE" }),
		).resolves.toBeNull();
	});

	it("explica que não conseguiu conectar quando o fetch lança", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				throw new TypeError("Failed to fetch");
			}),
		);

		const erro = await request("/livros").catch((falha) => falha);

		expect(erro).toBeInstanceOf(ErroApi);
		expect(erro.status).toBe(0);
		expect(erro.message).toMatch(/Não foi possível conectar à API/);
	});

	it("usa o detail do corpo quando a resposta não é ok", async () => {
		fetchQueResponde(
			resposta({ detail: "O leitor já tem 3 empréstimos ativos." }, 409),
		);

		const erro = await request("/emprestimos").catch((falha) => falha);

		expect(erro).toBeInstanceOf(ErroApi);
		expect(erro.status).toBe(409);
		expect(erro.message).toBe("O leitor já tem 3 empréstimos ativos.");
	});

	it("junta as mensagens do 422 do FastAPI, sem o prefixo Value error", async () => {
		fetchQueResponde(
			resposta(
				{
					detail: [
						{
							loc: ["body", "isbn"],
							msg: "Value error, O ISBN deve ter 10 ou 13 dígitos.",
						},
						{ loc: ["body", "ano"], msg: "Field required" },
					],
				},
				422,
			),
		);

		const erro = await request("/livros").catch((falha) => falha);

		expect(erro.status).toBe(422);
		expect(erro.message).toBe(
			"O ISBN deve ter 10 ou 13 dígitos. Field required",
		);
	});

	it("usa uma mensagem pelo status quando o erro vem sem corpo", async () => {
		fetchQueResponde(resposta(undefined, 500));

		const erro = await request("/painel").catch((falha) => falha);

		expect(erro.status).toBe(500);
		expect(erro.message).toBe(
			"Erro interno na API. Tente de novo em instantes.",
		);
	});

	it("monta a URL com a base da API e ignora filtros vazios", async () => {
		const fetch = fetchQueResponde(resposta([]));

		await request("/livros", {
			params: { busca: "", disponivel: true, x: undefined },
		});

		expect(fetch.mock.calls[0][0]).toBe(
			"http://api.teste/livros?disponivel=true",
		);
	});

	it("não descarta o caminho da base da API", async () => {
		const { request: requestComBase } = await importarComBase(
			"http://servidor/api/",
		);
		const fetch = fetchQueResponde(resposta([]));

		await requestComBase("/livros");

		expect(fetch.mock.calls[0][0]).toBe("http://servidor/api/livros");
	});

	it("envia o corpo como JSON com o cabeçalho certo", async () => {
		const fetch = fetchQueResponde(resposta({ id: 1 }, 201));

		await request("/leitores", { method: "POST", body: { nome: "Ana" } });

		expect(fetch.mock.calls[0][1]).toEqual({
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ nome: "Ana" }),
		});
	});
});
