import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { EmprestimosPage } from "../../src/pages/EmprestimosPage";
import { corpoEnviado, resposta, simularApi } from "../apoio";

const LIVROS = [
	{ id: 1, titulo: "Clean Code", disponiveis: 0, tamanho_fila: 0 },
	{ id: 2, titulo: "Redes", disponiveis: 2, tamanho_fila: 0 },
	{ id: 3, titulo: "Algoritmos", disponiveis: 1, tamanho_fila: 0 },
];
const LEITORES = [
	{ id: 10, nome: "Ana Souza" },
	{ id: 11, nome: "Bruno Lima" },
];

function emprestimo(campos) {
	return {
		id: 1,
		livro: { id: 1, titulo: "Clean Code" },
		leitor: { id: 10, nome: "Ana Souza" },
		data_emprestimo: "2026-03-02",
		data_prevista: "2026-03-16",
		data_devolucao: null,
		renovacoes: 0,
		status: "ativo",
		dias_atraso: 0,
		...campos,
	};
}

describe("EmprestimosPage", () => {
	it("mostra quantos exemplares de cada livro estão disponíveis no select", async () => {
		simularApi({
			"GET /emprestimos": [],
			"GET /livros": LIVROS,
			"GET /leitores": LEITORES,
		});
		render(<EmprestimosPage />);

		expect(
			await screen.findByRole("option", { name: "Redes (2 disponíveis)" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("option", { name: "Algoritmos (1 disponível)" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("option", { name: "Clean Code (0 disponíveis)" }),
		).toBeInTheDocument();
	});

	it("mostra a mensagem do 409 da API ao tentar emprestar", async () => {
		const usuario = userEvent.setup();
		const fetch = simularApi({
			"GET /emprestimos": [],
			"GET /livros": LIVROS,
			"GET /leitores": LEITORES,
			"POST /emprestimos": resposta(
				{
					detail:
						'Não há exemplar disponível de "Clean Code". O leitor pode entrar na fila de reserva.',
				},
				409,
			),
		});
		render(<EmprestimosPage />);
		await screen.findByText("Nenhum empréstimo encontrado.");
		await screen.findByRole("option", { name: "Bruno Lima" });

		await usuario.selectOptions(screen.getByLabelText("Livro"), "1");
		await usuario.selectOptions(screen.getByLabelText("Leitor"), "11");
		await usuario.click(screen.getByRole("button", { name: "Emprestar" }));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			'Não há exemplar disponível de "Clean Code". O leitor pode entrar na fila de reserva.',
		);
		const indicePost = fetch.mock.calls.findIndex(
			([, op]) => op.method === "POST",
		);
		expect(corpoEnviado(fetch, indicePost)).toEqual({
			livro_id: 1,
			leitor_id: 11,
		});
	});

	it("exige livro e leitor antes de enviar", async () => {
		const usuario = userEvent.setup();
		simularApi({
			"GET /emprestimos": [],
			"GET /livros": LIVROS,
			"GET /leitores": LEITORES,
		});
		render(<EmprestimosPage />);
		await screen.findByText("Nenhum empréstimo encontrado.");

		await usuario.click(screen.getByRole("button", { name: "Emprestar" }));

		expect(screen.getByLabelText("Livro")).toHaveAccessibleDescription(
			"Escolha o livro.",
		);
		expect(screen.getByLabelText("Leitor")).toHaveAccessibleDescription(
			"Escolha o leitor.",
		);
	});

	it("destaca atrasados e só mostra devolver e renovar quando fazem sentido", async () => {
		simularApi({
			"GET /emprestimos": [
				emprestimo({ id: 1 }),
				emprestimo({
					id: 2,
					leitor: { id: 11, nome: "Bruno Lima" },
					status: "atrasado",
					dias_atraso: 4,
				}),
				emprestimo({
					id: 3,
					livro: { id: 2, titulo: "Redes" },
					status: "devolvido",
					data_devolucao: "2026-03-10",
				}),
				emprestimo({ id: 4, livro: { id: 2, titulo: "Redes" }, renovacoes: 2 }),
			],
			"GET /livros": LIVROS,
			"GET /leitores": LEITORES,
		});
		render(<EmprestimosPage />);

		const linhas = (await screen.findAllByRole("row")).slice(1);
		const [ativo, atrasado, devolvido, noLimite] = linhas.map((linha) =>
			within(linha),
		);

		expect(
			ativo.getByRole("button", { name: /^Devolver/ }),
		).toBeInTheDocument();
		expect(ativo.getByRole("button", { name: /^Renovar/ })).toBeInTheDocument();
		expect(ativo.getByText("0/2")).toBeInTheDocument();
		expect(ativo.getByText("16/03/2026")).toBeInTheDocument();

		expect(linhas[1]).toHaveClass("bg-red-50");
		expect(atrasado.getByText("Atrasado")).toBeInTheDocument();
		expect(atrasado.getByText("4")).toBeInTheDocument();
		expect(atrasado.queryByRole("button", { name: /^Renovar/ })).toBeNull();

		expect(devolvido.queryByRole("button")).toBeNull();
		expect(noLimite.getByText("2/2")).toBeInTheDocument();
		expect(noLimite.queryByRole("button", { name: /^Renovar/ })).toBeNull();
	});

	it("devolve e recarrega a lista", async () => {
		const usuario = userEvent.setup();
		let lista = [emprestimo({})];
		simularApi({
			"GET /emprestimos": () => resposta(lista),
			"GET /livros": LIVROS,
			"GET /leitores": LEITORES,
			"POST /emprestimos/1/devolucao": () => {
				lista = [
					emprestimo({ status: "devolvido", data_devolucao: "2026-03-05" }),
				];
				return resposta(lista[0]);
			},
		});
		render(<EmprestimosPage />);

		await usuario.click(
			await screen.findByRole("button", {
				name: "Devolver Clean Code de Ana Souza",
			}),
		);

		expect(await screen.findByRole("status")).toHaveTextContent(
			"Devolução registrada.",
		);
		const linha = within(await screen.findByRole("table"));
		expect(await linha.findByText("Devolvido")).toBeInTheDocument();
		expect(linha.getByText("05/03/2026")).toBeInTheDocument();
		expect(linha.queryByRole("button")).toBeNull();
	});
});
