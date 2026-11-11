import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TarefasPage } from "../../src/pages/TarefasPage.jsx";
import { instalarApiFalsa } from "../helpers/apiFalsa.js";

const MENSAGEM_SEM_API =
	"Não foi possível conectar à API. Verifique se o backend está no ar.";

let user;

beforeEach(() => {
	user = userEvent.setup();
});

afterEach(() => {
	vi.unstubAllGlobals();
});

function tarefa(id, titulo, extras = {}) {
	return { id, titulo, descricao: null, concluida: false, ...extras };
}

// Renderiza a página com as tarefas já "no banco" e espera o carregamento inicial
async function abrirPagina(tarefas = []) {
	const api = instalarApiFalsa(tarefas);
	render(<TarefasPage />);
	await screen.findByText(/pendente\(s\) de/);
	return api;
}

async function adicionarTarefa(titulo, descricao = "") {
	await user.type(screen.getByLabelText("Título"), titulo);
	if (descricao) {
		await user.type(screen.getByLabelText(/Descrição/), descricao);
	}
	await user.click(screen.getByRole("button", { name: "Adicionar tarefa" }));
}

async function abrirEdicao(titulo) {
	await user.click(screen.getByRole("button", { name: `Editar ${titulo}` }));
	await screen.findByRole("button", { name: "Salvar alterações" });
}

function titulosNaLista() {
	return within(screen.getByRole("list", { name: "Lista de tarefas" }))
		.getAllByRole("listitem")
		.map((item) => item.querySelector("p").textContent);
}

function ultimaChamada(api) {
	return api.chamadas.at(-1);
}

describe("TarefasPage: carregamento", () => {
	it("mostra o estado de carregamento até a API responder", async () => {
		const api = instalarApiFalsa([tarefa(1, "Da API")]);
		const liberar = api.segurarRespostas();
		render(<TarefasPage />);

		expect(screen.getAllByText("Carregando tarefas...").length).toBeGreaterThan(
			0,
		);
		expect(screen.queryByText("Da API")).not.toBeInTheDocument();

		liberar();

		expect(await screen.findByText("Da API")).toBeInTheDocument();
		expect(screen.queryByText("Carregando tarefas...")).not.toBeInTheDocument();
	});

	it("lista o que veio da API e calcula o contador", async () => {
		await abrirPagina([
			tarefa(1, "Pendente"),
			tarefa(2, "Feita", { concluida: true }),
		]);

		expect(titulosNaLista()).toEqual(["Pendente", "Feita"]);
		expect(
			screen.getByText("1 pendente(s) de 2 tarefa(s)"),
		).toBeInTheDocument();
	});

	it("mostra a lista vazia quando a API não tem tarefas", async () => {
		await abrirPagina();

		expect(screen.getByText("Nenhuma tarefa para exibir.")).toBeInTheDocument();
		expect(
			screen.getByText("0 pendente(s) de 0 tarefa(s)"),
		).toBeInTheDocument();
	});

	it("mostra o erro no lugar da lista quando a API está fora do ar", async () => {
		const api = instalarApiFalsa();
		api.foraDoAr();
		render(<TarefasPage />);

		expect(await screen.findByRole("alert")).toHaveTextContent(
			MENSAGEM_SEM_API,
		);
		// "Nenhuma tarefa" aqui seria mentira: não se sabe o que existe no banco
		expect(
			screen.queryByText("Nenhuma tarefa para exibir."),
		).not.toBeInTheDocument();
		expect(screen.queryByText(/pendente\(s\) de/)).not.toBeInTheDocument();
		// Sem a lista, um cadastro bem-sucedido ficaria invisível e geraria duplicata
		expect(
			screen.getByRole("button", { name: "Adicionar tarefa" }),
		).toBeDisabled();
	});

	it("não permite cadastrar enquanto a lista carrega", async () => {
		const api = instalarApiFalsa();
		const liberar = api.segurarRespostas();
		render(<TarefasPage />);

		expect(
			screen.getByRole("button", { name: "Adicionar tarefa" }),
		).toBeDisabled();

		liberar();
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: "Adicionar tarefa" }),
			).toBeEnabled(),
		);
	});

	it("carrega de novo ao clicar em Tentar novamente", async () => {
		const api = instalarApiFalsa([tarefa(1, "Voltou")]);
		api.foraDoAr();
		render(<TarefasPage />);

		await user.click(
			await screen.findByRole("button", { name: "Tentar novamente" }),
		);

		expect(await screen.findByText("Voltou")).toBeInTheDocument();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});
});

describe("TarefasPage: operações na API", () => {
	it("cadastra com POST e mostra a tarefa com o id gerado pela API", async () => {
		const api = await abrirPagina([tarefa(5, "Existente")]);

		await adicionarTarefa("Nova", "com descrição");

		await screen.findByText("Nova");
		expect(ultimaChamada(api)).toMatchObject({
			metodo: "POST",
			corpo: { titulo: "Nova", descricao: "com descrição" },
		});
		expect(titulosNaLista()).toEqual(["Existente", "Nova"]);
		expect(
			screen.getByRole("checkbox", { name: "Concluída: Nova" }),
		).not.toBeChecked();
		expect(screen.getByLabelText("Título")).toHaveValue("");
	});

	it("não chama a API quando o formulário é inválido", async () => {
		const api = await abrirPagina();
		const chamadasAntes = api.chamadas.length;

		await adicionarTarefa("   ");

		expect(screen.getByText("O título é obrigatório.")).toBeInTheDocument();
		expect(api.chamadas).toHaveLength(chamadasAntes);
	});

	it("marca e desmarca a conclusão com PATCH só do campo concluida", async () => {
		const api = await abrirPagina([tarefa(1, "Escrever testes")]);
		const checkbox = screen.getByRole("checkbox", {
			name: "Concluída: Escrever testes",
		});

		await user.click(checkbox);
		await waitFor(() => expect(checkbox).toBeChecked());
		expect(ultimaChamada(api)).toMatchObject({
			metodo: "PATCH",
			corpo: { concluida: true },
		});
		await screen.findByText("0 pendente(s) de 1 tarefa(s)");

		await user.click(checkbox);
		await waitFor(() => expect(checkbox).not.toBeChecked());
		expect(ultimaChamada(api).corpo).toEqual({ concluida: false });
	});

	it("filtra pela API com o query parameter concluida", async () => {
		const api = await abrirPagina([
			tarefa(1, "Pendente"),
			tarefa(2, "Feita", { concluida: true }),
		]);

		await user.click(screen.getByRole("button", { name: "Pendentes" }));
		await waitFor(() => expect(titulosNaLista()).toEqual(["Pendente"]));
		expect(ultimaChamada(api).url).toMatch(/\/tarefas\?concluida=false$/);
		expect(screen.getByRole("button", { name: "Pendentes" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);

		await user.click(screen.getByRole("button", { name: "Concluídas" }));
		await waitFor(() => expect(titulosNaLista()).toEqual(["Feita"]));
		expect(ultimaChamada(api).url).toMatch(/\/tarefas\?concluida=true$/);

		// "Todas" já está na lista completa carregada no início
		const chamadasAntes = api.chamadas.length;
		await user.click(screen.getByRole("button", { name: "Todas" }));
		expect(titulosNaLista()).toEqual(["Pendente", "Feita"]);
		expect(api.chamadas).toHaveLength(chamadasAntes);
	});

	it("mantém o contador com o total mesmo com filtro ativo", async () => {
		await abrirPagina([
			tarefa(1, "Pendente"),
			tarefa(2, "Feita", { concluida: true }),
		]);

		await user.click(screen.getByRole("button", { name: "Concluídas" }));

		await waitFor(() => expect(titulosNaLista()).toEqual(["Feita"]));
		expect(
			screen.getByText("1 pendente(s) de 2 tarefa(s)"),
		).toBeInTheDocument();
	});

	it("tira a tarefa do filtro Pendentes ao concluí-la", async () => {
		await abrirPagina([tarefa(1, "Vai sair"), tarefa(2, "Fica")]);
		await user.click(screen.getByRole("button", { name: "Pendentes" }));
		await waitFor(() => expect(titulosNaLista()).toEqual(["Vai sair", "Fica"]));

		await user.click(
			screen.getByRole("checkbox", { name: "Concluída: Vai sair" }),
		);

		await waitFor(() => expect(titulosNaLista()).toEqual(["Fica"]));
	});

	it("mostra o erro se o filtro falhar na API", async () => {
		const api = await abrirPagina([tarefa(1, "Qualquer")]);
		api.foraDoAr();

		await user.click(screen.getByRole("button", { name: "Concluídas" }));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			MENSAGEM_SEM_API,
		);
		// O erro ocupa o lugar da lista, sem ficar preso em "Carregando"
		expect(screen.queryByText("Carregando tarefas...")).not.toBeInTheDocument();
	});

	it("recupera o filtro ao clicar em Tentar novamente", async () => {
		const api = await abrirPagina([
			tarefa(1, "Pendente"),
			tarefa(2, "Feita", { concluida: true }),
		]);
		api.foraDoAr();
		await user.click(screen.getByRole("button", { name: "Concluídas" }));

		await user.click(
			await screen.findByRole("button", { name: "Tentar novamente" }),
		);

		await waitFor(() => expect(titulosNaLista()).toEqual(["Feita"]));
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("mostra mensagem vazia quando o filtro não tem resultados", async () => {
		await abrirPagina([tarefa(1, "Ainda pendente")]);

		await user.click(screen.getByRole("button", { name: "Concluídas" }));

		expect(
			await screen.findByText("Nenhuma tarefa para exibir."),
		).toBeInTheDocument();
	});

	it("abre a edição com GET e salva com PUT pelo mesmo formulário", async () => {
		const api = await abrirPagina([tarefa(1, "Título antigo")]);

		await abrirEdicao("Título antigo");
		expect(ultimaChamada(api)).toMatchObject({ metodo: "GET" });
		expect(ultimaChamada(api).url).toMatch(/\/tarefas\/1$/);

		const titulo = screen.getByLabelText("Título");
		expect(titulo).toHaveValue("Título antigo");
		expect(titulo).toHaveFocus();
		expect(screen.getByRole("listitem")).toHaveAttribute(
			"aria-current",
			"true",
		);

		await user.clear(titulo);
		await user.type(titulo, "Título novo");
		await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

		await screen.findByRole("button", { name: "Adicionar tarefa" });
		expect(ultimaChamada(api)).toMatchObject({
			metodo: "PUT",
			corpo: { titulo: "Título novo", descricao: null, concluida: false },
		});
		expect(titulosNaLista()).toEqual(["Título novo"]);
		expect(screen.getByRole("listitem")).not.toHaveAttribute("aria-current");
		expect(screen.getByLabelText("Título")).toHaveValue("");
	});

	it("cancela a edição sem chamar o PUT", async () => {
		const api = await abrirPagina([tarefa(1, "Intocada")]);

		await abrirEdicao("Intocada");
		await user.type(screen.getByLabelText("Título"), " modificada");
		await user.click(screen.getByRole("button", { name: "Cancelar" }));

		expect(titulosNaLista()).toEqual(["Intocada"]);
		expect(screen.getByLabelText("Título")).toHaveValue("");
		expect(api.chamadas.some(({ metodo }) => metodo === "PUT")).toBe(false);
	});

	it("mantém o status de concluída ao editar", async () => {
		const api = await abrirPagina([
			tarefa(1, "Concluir e editar", { concluida: true }),
		]);

		await abrirEdicao("Concluir e editar");
		await user.type(screen.getByLabelText("Título"), "!");
		await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

		expect(
			await screen.findByRole("checkbox", {
				name: "Concluída: Concluir e editar!",
			}),
		).toBeChecked();
		expect(ultimaChamada(api).corpo.concluida).toBe(true);
	});

	it("remove com DELETE e tira a tarefa da lista", async () => {
		const api = await abrirPagina([tarefa(1, "Fica"), tarefa(2, "Sai")]);

		await user.click(screen.getByRole("button", { name: "Remover Sai" }));

		await waitFor(() => expect(titulosNaLista()).toEqual(["Fica"]));
		expect(ultimaChamada(api)).toMatchObject({ metodo: "DELETE" });
		expect(ultimaChamada(api).url).toMatch(/\/tarefas\/2$/);
		await screen.findByText("1 pendente(s) de 1 tarefa(s)");
	});

	it("sai do modo de edição ao remover a tarefa sendo editada", async () => {
		await abrirPagina([tarefa(1, "Editando")]);

		await abrirEdicao("Editando");
		await user.click(screen.getByRole("button", { name: "Remover Editando" }));

		await screen.findByRole("button", { name: "Adicionar tarefa" });
		expect(screen.getByLabelText("Título")).toHaveValue("");
	});

	it("desabilita as ações enquanto uma operação está em andamento", async () => {
		const api = await abrirPagina([tarefa(1, "Lenta")]);
		const liberar = api.segurarRespostas();

		await user.click(screen.getByRole("button", { name: "Remover Lenta" }));

		expect(screen.getByRole("button", { name: "Editar Lenta" })).toBeDisabled();
		expect(
			screen.getByRole("button", { name: "Adicionar tarefa" }),
		).toBeDisabled();
		expect(screen.getByText("Salvando...")).toBeInTheDocument();

		liberar();
		await screen.findByText("Nenhuma tarefa para exibir.");
	});
});

describe("TarefasPage: erros aparecem na interface", () => {
	it("mantém o texto digitado e mostra o erro se o cadastro falhar", async () => {
		const api = await abrirPagina();
		api.falharComDetail(422, [
			{ loc: ["body", "titulo"], msg: "String too long" },
		]);

		await adicionarTarefa("Rejeitada", "descrição");

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"titulo: String too long",
		);
		expect(screen.getByLabelText("Título")).toHaveValue("Rejeitada");
		expect(screen.getByLabelText(/Descrição/)).toHaveValue("descrição");
		expect(screen.getByText("Nenhuma tarefa para exibir.")).toBeInTheDocument();
	});

	it("mostra que a API está fora do ar se o cadastro não conectar", async () => {
		const api = await abrirPagina();
		api.foraDoAr();

		await adicionarTarefa("Sem conexão");

		expect(await screen.findByRole("alert")).toHaveTextContent(
			MENSAGEM_SEM_API,
		);
		expect(screen.getByLabelText("Título")).toHaveValue("Sem conexão");
	});

	it("não marca a tarefa como concluída se o PATCH falhar", async () => {
		const api = await abrirPagina([tarefa(1, "Pendente")]);
		api.falharComDetail(503, "Não foi possível acessar o banco de dados.");

		await user.click(
			screen.getByRole("checkbox", { name: "Concluída: Pendente" }),
		);

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Não foi possível acessar o banco de dados.",
		);
		expect(
			screen.getByRole("checkbox", { name: "Concluída: Pendente" }),
		).not.toBeChecked();
	});

	it("continua editando e mantém o texto se o PUT falhar", async () => {
		const api = await abrirPagina([tarefa(1, "Original")]);
		await abrirEdicao("Original");
		await user.type(screen.getByLabelText("Título"), " alterada");
		api.falharComDetail(503, "Não foi possível acessar o banco de dados.");

		await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

		await screen.findByRole("alert");
		expect(screen.getByLabelText("Título")).toHaveValue("Original alterada");
		expect(titulosNaLista()).toEqual(["Original"]);
	});

	it("mantém a tarefa na lista se o DELETE falhar", async () => {
		const api = await abrirPagina([tarefa(1, "Protegida")]);
		api.falharComDetail(503, "Não foi possível acessar o banco de dados.");

		await user.click(screen.getByRole("button", { name: "Remover Protegida" }));

		await screen.findByRole("alert");
		expect(titulosNaLista()).toEqual(["Protegida"]);
	});

	it("mostra o 404 da API e atualiza a lista quando a tarefa sumiu", async () => {
		const api = await abrirPagina([tarefa(1, "Fantasma"), tarefa(2, "Real")]);
		api.removerPorFora(1);

		await user.click(screen.getByRole("button", { name: "Remover Fantasma" }));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Tarefa não encontrada",
		);
		await waitFor(() => expect(titulosNaLista()).toEqual(["Real"]));
	});

	it("não apaga o texto digitado se a tarefa sumiu durante a edição", async () => {
		const api = await abrirPagina([tarefa(1, "Sumiu"), tarefa(2, "Real")]);
		await abrirEdicao("Sumiu");
		await user.type(screen.getByLabelText("Título"), " com texto longo");
		api.removerPorFora(1);

		await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Tarefa não encontrada",
		);
		await waitFor(() => expect(titulosNaLista()).toEqual(["Real"]));
		expect(screen.getByLabelText("Título")).toHaveValue(
			"Sumiu com texto longo",
		);
		// Sem a tarefa original, salvar agora é cadastrar de novo
		expect(
			screen.getByRole("button", { name: "Adicionar tarefa" }),
		).toBeInTheDocument();
	});

	it("limpa o erro ao cancelar a edição que falhou", async () => {
		const api = await abrirPagina([tarefa(1, "Original")]);
		await abrirEdicao("Original");
		api.falharComDetail(503, "Não foi possível acessar o banco de dados.");
		await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
		await screen.findByRole("alert");

		await user.click(screen.getByRole("button", { name: "Cancelar" }));

		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("limpa o erro na operação seguinte que der certo", async () => {
		const api = await abrirPagina();
		api.foraDoAr();
		await adicionarTarefa("Segunda tentativa");
		await screen.findByRole("alert");

		await user.click(screen.getByRole("button", { name: "Adicionar tarefa" }));

		await screen.findByText("1 pendente(s) de 1 tarefa(s)");
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		expect(titulosNaLista()).toEqual(["Segunda tentativa"]);
	});
});
