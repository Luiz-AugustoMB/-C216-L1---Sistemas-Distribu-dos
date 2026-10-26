import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { TarefasPage } from "../../src/pages/TarefasPage.jsx";

let user;

beforeEach(() => {
	user = userEvent.setup();
	render(<TarefasPage />);
});

async function adicionarTarefa(titulo, descricao = "") {
	await user.type(screen.getByLabelText("Título"), titulo);
	if (descricao) {
		await user.type(screen.getByLabelText(/Descrição/), descricao);
	}
	await user.click(screen.getByRole("button", { name: "Adicionar tarefa" }));
}

function titulosNaLista() {
	return within(screen.getByRole("list", { name: "Lista de tarefas" }))
		.getAllByRole("listitem")
		.map((item) => item.querySelector("p").textContent);
}

describe("TarefasPage: formulário + lista", () => {
	it("começa sem tarefas", () => {
		expect(screen.getByText("Nenhuma tarefa para exibir.")).toBeInTheDocument();
		expect(
			screen.getByText("0 pendente(s) de 0 tarefa(s)"),
		).toBeInTheDocument();
	});

	it("adiciona tarefas na lista e atualiza o contador", async () => {
		await adicionarTarefa("Configurar Vite", "com o plugin do Tailwind");
		await adicionarTarefa("Configurar Biome");

		expect(titulosNaLista()).toEqual(["Configurar Vite", "Configurar Biome"]);
		expect(screen.getByText("com o plugin do Tailwind")).toBeInTheDocument();
		expect(
			screen.getByText("2 pendente(s) de 2 tarefa(s)"),
		).toBeInTheDocument();
	});

	it("não adiciona tarefa inválida", async () => {
		await adicionarTarefa("   ");

		expect(screen.getByText("O título é obrigatório.")).toBeInTheDocument();
		expect(screen.getByText("Nenhuma tarefa para exibir.")).toBeInTheDocument();
	});

	it("marca e desmarca uma tarefa como concluída", async () => {
		await adicionarTarefa("Escrever testes");
		const checkbox = screen.getByRole("checkbox", {
			name: "Concluída: Escrever testes",
		});

		await user.click(checkbox);
		expect(checkbox).toBeChecked();
		expect(
			screen.getByText("0 pendente(s) de 1 tarefa(s)"),
		).toBeInTheDocument();

		await user.click(checkbox);
		expect(checkbox).not.toBeChecked();
		expect(
			screen.getByText("1 pendente(s) de 1 tarefa(s)"),
		).toBeInTheDocument();
	});

	it("filtra por pendentes e concluídas", async () => {
		await adicionarTarefa("Pendente");
		await adicionarTarefa("Feita");
		await user.click(
			screen.getByRole("checkbox", { name: "Concluída: Feita" }),
		);

		await user.click(screen.getByRole("button", { name: "Pendentes" }));
		expect(titulosNaLista()).toEqual(["Pendente"]);
		expect(screen.getByRole("button", { name: "Pendentes" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);

		await user.click(screen.getByRole("button", { name: "Concluídas" }));
		expect(titulosNaLista()).toEqual(["Feita"]);

		await user.click(screen.getByRole("button", { name: "Todas" }));
		expect(titulosNaLista()).toEqual(["Pendente", "Feita"]);
	});

	it("mostra mensagem vazia quando o filtro não tem resultados", async () => {
		await adicionarTarefa("Ainda pendente");

		await user.click(screen.getByRole("button", { name: "Concluídas" }));

		expect(screen.getByText("Nenhuma tarefa para exibir.")).toBeInTheDocument();
	});

	it("edita uma tarefa pelo mesmo formulário", async () => {
		await adicionarTarefa("Título antigo");

		await user.click(
			screen.getByRole("button", { name: "Editar Título antigo" }),
		);
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

		expect(titulosNaLista()).toEqual(["Título novo"]);
		expect(screen.getByRole("listitem")).not.toHaveAttribute("aria-current");
		// Volta ao modo de cadastro depois de salvar
		expect(
			screen.getByRole("button", { name: "Adicionar tarefa" }),
		).toBeInTheDocument();
		expect(screen.getByLabelText("Título")).toHaveValue("");
	});

	it("cancela a edição sem alterar a tarefa", async () => {
		await adicionarTarefa("Intocada");

		await user.click(screen.getByRole("button", { name: "Editar Intocada" }));
		await user.type(screen.getByLabelText("Título"), " modificada");
		await user.click(screen.getByRole("button", { name: "Cancelar" }));

		expect(titulosNaLista()).toEqual(["Intocada"]);
		expect(screen.getByLabelText("Título")).toHaveValue("");
	});

	it("mantém o status de concluída ao editar", async () => {
		await adicionarTarefa("Concluir e editar");
		await user.click(
			screen.getByRole("checkbox", { name: "Concluída: Concluir e editar" }),
		);

		await user.click(
			screen.getByRole("button", { name: "Editar Concluir e editar" }),
		);
		await user.type(screen.getByLabelText("Título"), "!");
		await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

		expect(
			screen.getByRole("checkbox", { name: "Concluída: Concluir e editar!" }),
		).toBeChecked();
	});

	it("remove uma tarefa", async () => {
		await adicionarTarefa("Fica");
		await adicionarTarefa("Sai");

		await user.click(screen.getByRole("button", { name: "Remover Sai" }));

		expect(titulosNaLista()).toEqual(["Fica"]);
		expect(
			screen.getByText("1 pendente(s) de 1 tarefa(s)"),
		).toBeInTheDocument();
	});

	it("sai do modo de edição ao remover a tarefa sendo editada", async () => {
		await adicionarTarefa("Editando");

		await user.click(screen.getByRole("button", { name: "Editar Editando" }));
		await user.click(screen.getByRole("button", { name: "Remover Editando" }));

		expect(
			screen.getByRole("button", { name: "Adicionar tarefa" }),
		).toBeInTheDocument();
		expect(screen.getByLabelText("Título")).toHaveValue("");
	});

	it("não reaproveita ids após remover (sem chaves duplicadas)", async () => {
		await adicionarTarefa("A");
		await adicionarTarefa("B");
		await user.click(screen.getByRole("button", { name: "Remover A" }));
		await adicionarTarefa("C");

		// Com id = length + 1, "C" receberia o mesmo id de "B" e editar "C" alteraria "B"
		await user.click(screen.getByRole("button", { name: "Editar C" }));
		await user.type(screen.getByLabelText("Título"), "2");
		await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

		expect(titulosNaLista()).toEqual(["B", "C2"]);
	});
});
