import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LivrosPage } from "../../src/pages/LivrosPage";
import { corpoEnviado, resposta, simularApi } from "../apoio";

const REDES = {
	id: 1,
	titulo: "Redes de Computadores",
	autor: "Kurose",
	isbn: "9780133594140",
	ano: 2016,
	exemplares: 2,
	criado_em: "2026-03-01T12:00:00Z",
	disponiveis: 1,
	emprestados: 1,
	separados_para_reserva: 0,
	tamanho_fila: 0,
};

describe("LivrosPage", () => {
	it("lista os livros com disponíveis, emprestados, separados e fila", async () => {
		simularApi({ "GET /livros": [REDES] });

		render(<LivrosPage />);

		const linha = (await screen.findByText("Redes de Computadores")).closest(
			"tr",
		);
		const celulas = within(linha)
			.getAllByRole("cell")
			.map((celula) => celula.textContent);
		expect(celulas.slice(0, 8)).toEqual([
			"Redes de Computadores",
			"Kurose",
			"2016",
			"9780133594140",
			"1/2",
			"1",
			"0",
			"0",
		]);
	});

	it("mostra o estado vazio e o erro de conexão", async () => {
		simularApi({ "GET /livros": [] });
		render(<LivrosPage />);
		expect(
			await screen.findByText("Nenhum livro encontrado."),
		).toBeInTheDocument();
	});

	it("filtra pelos parâmetros que a rota aceita", async () => {
		const usuario = userEvent.setup();
		const fetch = simularApi({ "GET /livros": [] });
		render(<LivrosPage />);
		await screen.findByText("Nenhum livro encontrado.");

		await usuario.type(
			screen.getByLabelText("Buscar por título ou autor"),
			"redes",
		);
		await usuario.click(screen.getByRole("button", { name: "Buscar" }));
		await usuario.click(screen.getByLabelText("Só com exemplar disponível"));
		await screen.findByText("Nenhum livro encontrado.");

		const urls = fetch.mock.calls.map(([url]) => url);
		expect(urls).toContain("http://api.teste/livros?busca=redes");
		expect(urls).toContain(
			"http://api.teste/livros?busca=redes&disponivel=true",
		);
	});

	it("cadastra um livro e recarrega a lista", async () => {
		const usuario = userEvent.setup();
		let livros = [];
		const fetch = simularApi({
			"GET /livros": () => resposta(livros),
			"POST /livros": (_url, opcoes) => {
				livros = [{ ...REDES, ...JSON.parse(opcoes.body) }];
				return resposta(livros[0], 201);
			},
		});
		render(<LivrosPage />);
		await screen.findByText("Nenhum livro encontrado.");

		await usuario.type(
			screen.getByLabelText("Título"),
			"  Redes de Computadores ",
		);
		await usuario.type(screen.getByLabelText("Autor"), "Kurose");
		await usuario.type(screen.getByLabelText("ISBN"), "978-0-13-359414-0");
		await usuario.type(screen.getByLabelText("Ano"), "2016");
		await usuario.clear(screen.getByLabelText("Exemplares"));
		await usuario.type(screen.getByLabelText("Exemplares"), "2");
		await usuario.click(
			screen.getByRole("button", { name: "Cadastrar livro" }),
		);

		expect(await screen.findByRole("status")).toHaveTextContent(
			"Livro cadastrado.",
		);
		expect(
			await screen.findByText("Redes de Computadores"),
		).toBeInTheDocument();
		const indicePost = fetch.mock.calls.findIndex(
			([, op]) => op.method === "POST",
		);
		expect(corpoEnviado(fetch, indicePost)).toEqual({
			titulo: "Redes de Computadores",
			autor: "Kurose",
			isbn: "978-0-13-359414-0",
			ano: 2016,
			exemplares: 2,
		});
	});

	it("não envia o cadastro com dados inválidos e mostra o motivo", async () => {
		const usuario = userEvent.setup();
		const fetch = simularApi({ "GET /livros": [] });
		render(<LivrosPage />);
		await screen.findByText("Nenhum livro encontrado.");

		await usuario.type(screen.getByLabelText("ISBN"), "123");
		await usuario.click(
			screen.getByRole("button", { name: "Cadastrar livro" }),
		);

		expect(screen.getByLabelText("ISBN")).toHaveAccessibleDescription(
			"O ISBN deve ter 10 ou 13 dígitos, com ou sem hífen.",
		);
		expect(screen.getByLabelText("Título")).toHaveAccessibleDescription(
			"Informe o título.",
		);
		expect(fetch.mock.calls.every(([, op]) => op.method === "GET")).toBe(true);
	});

	it("pede confirmação na tela e mostra o 409 da exclusão", async () => {
		const usuario = userEvent.setup();
		simularApi({
			"GET /livros": [REDES],
			"DELETE /livros/1": resposta(
				{
					detail:
						"Este livro tem empréstimos ou reservas registrados e não pode ser excluído, para não perder o histórico.",
				},
				409,
			),
		});
		render(<LivrosPage />);

		await usuario.click(
			await screen.findByRole("button", {
				name: "Excluir Redes de Computadores",
			}),
		);
		await usuario.click(
			screen.getByRole("button", { name: "Confirmar exclusão" }),
		);

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"não pode ser excluído, para não perder o histórico",
		);
	});
});
