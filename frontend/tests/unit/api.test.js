import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, request } from "../../src/services/api.js";

const API_URL = import.meta.env.VITE_API_URL;

function resposta(corpo, status) {
	return new Response(JSON.stringify(corpo), { status });
}

function stubFetch(implementacao) {
	const fetchFalso = vi.fn(implementacao);
	vi.stubGlobal("fetch", fetchFalso);
	return fetchFalso;
}

afterEach(() => {
	vi.unstubAllGlobals();
	vi.unstubAllEnvs();
});

describe("request: configuração", () => {
	it("avisa na tela quando VITE_API_URL não foi definida", async () => {
		vi.stubEnv("VITE_API_URL", "");
		const fetchFalso = stubFetch(async () => resposta([], 200));

		await expect(request("/tarefas")).rejects.toThrow(
			"VITE_API_URL não foi definida.",
		);
		expect(fetchFalso).not.toHaveBeenCalled();
	});
});

describe("request: API inacessível", () => {
	it("troca a rejeição do fetch por uma mensagem clara", async () => {
		stubFetch(() => Promise.reject(new TypeError("Failed to fetch")));

		const erro = await request("/tarefas").catch((e) => e);

		expect(erro).toBeInstanceOf(ApiError);
		expect(erro.message).toBe(
			"Não foi possível conectar à API. Verifique se o backend está no ar.",
		);
		expect(erro.status).toBeUndefined();
	});
});

describe("request: resposta de erro", () => {
	it("propaga o detail em texto do FastAPI junto com o status", async () => {
		stubFetch(async () => resposta({ detail: "Tarefa não encontrada" }, 404));

		const erro = await request("/tarefas/9").catch((e) => e);

		expect(erro).toBeInstanceOf(ApiError);
		expect(erro.message).toBe("Tarefa não encontrada");
		expect(erro.status).toBe(404);
	});

	it("junta os erros de validação do 422 indicando o campo", async () => {
		stubFetch(async () =>
			resposta(
				{
					detail: [
						{ loc: ["body", "titulo"], msg: "String too long" },
						{ loc: ["body", "descricao"], msg: "Input should be a string" },
					],
				},
				422,
			),
		);

		await expect(request("/tarefas")).rejects.toThrow(
			"titulo: String too long; descricao: Input should be a string",
		);
	});

	it("não repete o campo quando o erro de validação é do corpo inteiro", async () => {
		stubFetch(async () =>
			resposta(
				{ detail: [{ loc: ["body"], msg: "titulo não pode ser null" }] },
				422,
			),
		);

		await expect(request("/tarefas/1")).rejects.toThrow(
			/^titulo não pode ser null$/,
		);
	});

	it("usa mensagem genérica quando o erro não é JSON", async () => {
		stubFetch(
			async () => new Response("Internal Server Error", { status: 500 }),
		);

		await expect(request("/tarefas")).rejects.toThrow(
			"A API respondeu com erro 500.",
		);
	});

	it("usa mensagem genérica quando o JSON não tem detail", async () => {
		stubFetch(async () => resposta({ erro: "outro formato" }, 502));

		await expect(request("/tarefas")).rejects.toThrow(
			"A API respondeu com erro 502.",
		);
	});
});

describe("request: sucesso", () => {
	it("devolve os dados da resposta", async () => {
		const tarefas = [{ id: 1, titulo: "A" }];
		stubFetch(async () => resposta(tarefas, 200));

		await expect(request("/tarefas")).resolves.toEqual(tarefas);
	});

	it("devolve null no 204, que não tem corpo", async () => {
		stubFetch(async () => new Response(null, { status: 204 }));

		await expect(
			request("/tarefas/1", { method: "DELETE" }),
		).resolves.toBeNull();
	});

	it("não expõe o erro técnico quando um 2xx não é JSON", async () => {
		stubFetch(async () => new Response("<!doctype html>", { status: 200 }));

		const erro = await request("/tarefas").catch((e) => e);

		expect(erro).toBeInstanceOf(ApiError);
		expect(erro.message).toBe("A API respondeu em um formato inesperado.");
	});

	it("monta a URL a partir de VITE_API_URL", async () => {
		const fetchFalso = stubFetch(async () => resposta([], 200));

		await request("/tarefas");

		expect(fetchFalso).toHaveBeenCalledWith(`${API_URL}/tarefas`, {
			method: "GET",
		});
	});

	it("envia o corpo em JSON com o Content-Type", async () => {
		const fetchFalso = stubFetch(async () => resposta({ id: 1 }, 201));

		await request("/tarefas", { method: "POST", body: { titulo: "A" } });

		expect(fetchFalso).toHaveBeenCalledWith(`${API_URL}/tarefas`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: '{"titulo":"A"}',
		});
	});
});
