import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TarefaItem } from "../../src/components/TarefaItem.jsx";

function renderItem(tarefa, handlers = {}) {
	const props = {
		onAlternar: vi.fn(),
		onEditar: vi.fn(),
		onRemover: vi.fn(),
		...handlers,
	};
	render(
		<ul>
			<TarefaItem tarefa={tarefa} {...props} />
		</ul>,
	);
	return props;
}

const tarefa = {
	id: 7,
	titulo: "Estudar Vite",
	descricao: "Ler a documentação",
	concluida: false,
};

describe("TarefaItem", () => {
	it("exibe título e descrição", () => {
		renderItem(tarefa);

		expect(screen.getByText("Estudar Vite")).toBeInTheDocument();
		expect(screen.getByText("Ler a documentação")).toBeInTheDocument();
	});

	it("não exibe parágrafo de descrição quando ela é nula", () => {
		renderItem({ ...tarefa, descricao: null });

		expect(screen.queryByText("Ler a documentação")).not.toBeInTheDocument();
	});

	it("reflete o status no checkbox e risca a tarefa concluída", () => {
		renderItem({ ...tarefa, concluida: true });

		expect(screen.getByRole("checkbox")).toBeChecked();
		expect(screen.getByText("Estudar Vite")).toHaveClass("line-through");
	});

	it("não marca o item quando ele não está em edição", () => {
		renderItem(tarefa);

		expect(screen.getByRole("listitem")).not.toHaveAttribute("aria-current");
	});

	it("marca o item em edição com aria-current", () => {
		renderItem(tarefa, { emEdicao: true });

		expect(screen.getByRole("listitem")).toHaveAttribute(
			"aria-current",
			"true",
		);
	});

	it("chama os callbacks com o id da tarefa", async () => {
		const user = userEvent.setup();
		const { onAlternar, onEditar, onRemover } = renderItem(tarefa);

		await user.click(screen.getByRole("checkbox"));
		await user.click(
			screen.getByRole("button", { name: "Editar Estudar Vite" }),
		);
		await user.click(
			screen.getByRole("button", { name: "Remover Estudar Vite" }),
		);

		expect(onAlternar).toHaveBeenCalledWith(7);
		expect(onEditar).toHaveBeenCalledWith(7);
		expect(onRemover).toHaveBeenCalledWith(7);
	});
});
