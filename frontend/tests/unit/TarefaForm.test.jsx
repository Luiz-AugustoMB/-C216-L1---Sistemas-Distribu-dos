import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TarefaForm } from "../../src/components/TarefaForm.jsx";
import { TITULO_MAX } from "../../src/validation.js";

describe("TarefaForm (cadastro)", () => {
	it("envia os dados sem espaços nas pontas e limpa os campos", async () => {
		const user = userEvent.setup();
		const onSalvar = vi.fn().mockResolvedValue(true);
		render(<TarefaForm onSalvar={onSalvar} />);

		await user.type(screen.getByLabelText("Título"), "  Estudar Biome  ");
		await user.type(screen.getByLabelText(/Descrição/), "  linter  ");
		await user.click(screen.getByRole("button", { name: "Adicionar tarefa" }));

		expect(onSalvar).toHaveBeenCalledWith({
			titulo: "Estudar Biome",
			descricao: "linter",
		});
		expect(screen.getByLabelText("Título")).toHaveValue("");
		expect(screen.getByLabelText(/Descrição/)).toHaveValue("");
	});

	it("mantém os campos preenchidos quando o salvamento falha", async () => {
		const user = userEvent.setup();
		const onSalvar = vi.fn().mockResolvedValue(false);
		render(<TarefaForm onSalvar={onSalvar} />);

		await user.type(screen.getByLabelText("Título"), "Não pode sumir");
		await user.type(screen.getByLabelText(/Descrição/), "nem isto");
		await user.click(screen.getByRole("button", { name: "Adicionar tarefa" }));

		expect(onSalvar).toHaveBeenCalledOnce();
		expect(screen.getByLabelText("Título")).toHaveValue("Não pode sumir");
		expect(screen.getByLabelText(/Descrição/)).toHaveValue("nem isto");
	});

	it("desabilita o envio quando recebe desabilitado", () => {
		render(<TarefaForm desabilitado onSalvar={vi.fn()} />);

		expect(
			screen.getByRole("button", { name: "Adicionar tarefa" }),
		).toBeDisabled();
	});

	it("envia descrição vazia como null", async () => {
		const user = userEvent.setup();
		const onSalvar = vi.fn();
		render(<TarefaForm onSalvar={onSalvar} />);

		await user.type(screen.getByLabelText("Título"), "Sem descrição");
		await user.click(screen.getByRole("button", { name: "Adicionar tarefa" }));

		expect(onSalvar).toHaveBeenCalledWith({
			titulo: "Sem descrição",
			descricao: null,
		});
	});

	it("mostra erro e não envia quando o título está vazio", async () => {
		const user = userEvent.setup();
		const onSalvar = vi.fn();
		render(<TarefaForm onSalvar={onSalvar} />);

		await user.click(screen.getByRole("button", { name: "Adicionar tarefa" }));

		expect(screen.getByText("O título é obrigatório.")).toBeInTheDocument();
		expect(screen.getByLabelText("Título")).toHaveAttribute(
			"aria-invalid",
			"true",
		);
		expect(onSalvar).not.toHaveBeenCalled();
	});

	it("mostra erro quando o título passa do limite", async () => {
		const user = userEvent.setup();
		const onSalvar = vi.fn();
		render(<TarefaForm onSalvar={onSalvar} />);

		// paste em vez de type: digitar 101 caracteres um a um deixa o teste lento
		await user.click(screen.getByLabelText("Título"));
		await user.paste("a".repeat(TITULO_MAX + 1));
		await user.click(screen.getByRole("button", { name: "Adicionar tarefa" }));

		expect(
			screen.getByText(`O título deve ter no máximo ${TITULO_MAX} caracteres.`),
		).toBeInTheDocument();
		expect(onSalvar).not.toHaveBeenCalled();
	});

	it("não rouba o foco ao abrir a página no modo cadastro", () => {
		render(<TarefaForm onSalvar={vi.fn()} />);

		expect(screen.getByLabelText("Título")).not.toHaveFocus();
	});

	it("não exibe o botão Cancelar no cadastro", () => {
		render(<TarefaForm onSalvar={vi.fn()} />);

		expect(
			screen.queryByRole("button", { name: "Cancelar" }),
		).not.toBeInTheDocument();
	});
});

describe("TarefaForm (edição)", () => {
	const tarefa = {
		id: 1,
		titulo: "Original",
		descricao: null,
		concluida: false,
	};

	it("preenche os campos com a tarefa recebida", () => {
		render(<TarefaForm tarefa={tarefa} onSalvar={vi.fn()} />);

		expect(screen.getByRole("heading")).toHaveTextContent("Editar tarefa");
		expect(screen.getByLabelText("Título")).toHaveValue("Original");
		expect(screen.getByLabelText(/Descrição/)).toHaveValue("");
	});

	it("coloca o foco no título ao abrir a edição", () => {
		render(<TarefaForm tarefa={tarefa} onSalvar={vi.fn()} />);

		expect(screen.getByLabelText("Título")).toHaveFocus();
	});

	it("salva as alterações", async () => {
		const user = userEvent.setup();
		const onSalvar = vi.fn();
		render(<TarefaForm tarefa={tarefa} onSalvar={onSalvar} />);

		await user.clear(screen.getByLabelText("Título"));
		await user.type(screen.getByLabelText("Título"), "Alterada");
		await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

		expect(onSalvar).toHaveBeenCalledWith({
			titulo: "Alterada",
			descricao: null,
		});
	});

	it("bloqueia Cancelar e os campos sem tirar o foco quando desabilitado", () => {
		render(<TarefaForm tarefa={tarefa} desabilitado onSalvar={vi.fn()} />);

		expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
		expect(
			screen.getByRole("button", { name: "Salvar alterações" }),
		).toBeDisabled();
		expect(screen.getByLabelText("Título")).toHaveAttribute("readonly");
		expect(screen.getByLabelText(/Descrição/)).toHaveAttribute("readonly");
		expect(screen.getByLabelText("Título")).not.toBeDisabled();
	});

	it("chama onCancelar ao clicar em Cancelar", async () => {
		const user = userEvent.setup();
		const onCancelar = vi.fn();
		render(
			<TarefaForm tarefa={tarefa} onSalvar={vi.fn()} onCancelar={onCancelar} />,
		);

		await user.click(screen.getByRole("button", { name: "Cancelar" }));

		expect(onCancelar).toHaveBeenCalledOnce();
	});
});
