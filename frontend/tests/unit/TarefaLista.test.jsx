import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TarefaLista } from "../../src/components/TarefaLista.jsx";

const handlers = {
	onAlternar: vi.fn(),
	onEditar: vi.fn(),
	onRemover: vi.fn(),
};

describe("TarefaLista", () => {
	it("mostra mensagem quando não há tarefas", () => {
		render(<TarefaLista tarefas={[]} {...handlers} />);

		expect(screen.getByText("Nenhuma tarefa para exibir.")).toBeInTheDocument();
		expect(screen.queryByRole("list")).not.toBeInTheDocument();
	});

	it("renderiza um item por tarefa, na ordem recebida", () => {
		const tarefas = [
			{ id: 1, titulo: "Primeira", descricao: null, concluida: false },
			{ id: 2, titulo: "Segunda", descricao: null, concluida: true },
		];
		render(<TarefaLista tarefas={tarefas} {...handlers} />);

		const itens = screen.getAllByRole("listitem");
		expect(itens).toHaveLength(2);
		expect(itens[0]).toHaveTextContent("Primeira");
		expect(itens[1]).toHaveTextContent("Segunda");
	});
});
