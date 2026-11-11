import { beforeEach, describe, expect, it, vi } from "vitest";
import { request } from "../../src/services/api.js";
import { buscarMensagem } from "../../src/services/rootService.js";
import {
	atualizarTarefaParcial,
	buscarTarefa,
	criarTarefa,
	listarTarefas,
	removerTarefa,
	substituirTarefa,
} from "../../src/services/tarefaService.js";

vi.mock("../../src/services/api.js", () => ({ request: vi.fn() }));

beforeEach(() => {
	vi.mocked(request).mockReset();
});

describe("tarefaService espelha cada endpoint de /tarefas", () => {
	const dados = { titulo: "A", descricao: null, concluida: false };

	it("GET /tarefas", () => {
		listarTarefas();
		expect(request).toHaveBeenCalledWith("/tarefas");
	});

	it.each([
		[true, "/tarefas?concluida=true"],
		[false, "/tarefas?concluida=false"],
	])("GET /tarefas com concluida=%s", (concluida, caminho) => {
		listarTarefas(concluida);
		expect(request).toHaveBeenCalledWith(caminho);
	});

	it("GET /tarefas/{id}", () => {
		buscarTarefa(3);
		expect(request).toHaveBeenCalledWith("/tarefas/3");
	});

	it("POST /tarefas", () => {
		criarTarefa(dados);
		expect(request).toHaveBeenCalledWith("/tarefas", {
			method: "POST",
			body: dados,
		});
	});

	it("PUT /tarefas/{id}", () => {
		substituirTarefa(3, dados);
		expect(request).toHaveBeenCalledWith("/tarefas/3", {
			method: "PUT",
			body: dados,
		});
	});

	it("PATCH /tarefas/{id}", () => {
		atualizarTarefaParcial(3, { concluida: true });
		expect(request).toHaveBeenCalledWith("/tarefas/3", {
			method: "PATCH",
			body: { concluida: true },
		});
	});

	it("DELETE /tarefas/{id}", () => {
		removerTarefa(3);
		expect(request).toHaveBeenCalledWith("/tarefas/3", { method: "DELETE" });
	});
});

describe("rootService", () => {
	it("GET /", () => {
		buscarMensagem();
		expect(request).toHaveBeenCalledWith("/");
	});
});
