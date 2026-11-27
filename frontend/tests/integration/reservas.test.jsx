import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ReservasPage } from "../../src/pages/ReservasPage";
import { resposta, simularApi } from "../apoio";

const LIVRO = { id: 5, titulo: "Clean Code", disponiveis: 0, tamanho_fila: 1 };
const LEITORES = [
	{ id: 1, nome: "Ana Souza" },
	{ id: 2, nome: "Bruno Lima" },
	{ id: 3, nome: "Carla Mendes" },
];

function reserva(campos) {
	return {
		id: 1,
		livro: { id: 5, titulo: "Clean Code" },
		leitor: { id: 2, nome: "Bruno Lima" },
		status: "na_fila",
		criada_em: "2026-03-02T13:00:00Z",
		separada_em: null,
		expira_em: null,
		posicao_na_fila: 1,
		...campos,
	};
}

const RESERVAS = [
	reserva({
		id: 1,
		status: "aguardando_retirada",
		separada_em: "2026-03-05T12:00:00Z",
		expira_em: "2026-03-07",
		posicao_na_fila: null,
	}),
	reserva({
		id: 2,
		leitor: { id: 3, nome: "Carla Mendes" },
		posicao_na_fila: 1,
	}),
	reserva({
		id: 3,
		leitor: { id: 1, nome: "Ana Souza" },
		status: "cancelada",
		posicao_na_fila: null,
	}),
];

describe("ReservasPage", () => {
	it("mostra a posição na fila e para quem o exemplar está separado", async () => {
		simularApi({
			"GET /reservas": RESERVAS,
			"GET /livros": [LIVRO],
			"GET /leitores": LEITORES,
		});

		render(<ReservasPage />);

		expect(
			await screen.findByText("Separado para Bruno Lima até 07/03/2026"),
		).toBeInTheDocument();
		expect(screen.getByText("Posição 1 na fila")).toBeInTheDocument();

		const [separada, naFila, cancelada] = screen.getAllByRole("row").slice(1);
		expect(
			within(separada).getByRole("button", { name: /^Cancelar reserva/ }),
		).toBeInTheDocument();
		expect(
			within(naFila).getByRole("button", { name: /^Cancelar reserva/ }),
		).toBeInTheDocument();
		expect(within(cancelada).queryByRole("button")).toBeNull();
	});

	it("filtra por status e por livro com os parâmetros da rota", async () => {
		const usuario = userEvent.setup();
		const fetch = simularApi({
			"GET /reservas": [],
			"GET /livros": [LIVRO],
			"GET /leitores": LEITORES,
		});
		render(<ReservasPage />);
		await screen.findByText("Nenhuma reserva encontrada.");
		await screen.findByRole("option", { name: "Clean Code" });

		await usuario.selectOptions(
			screen.getByLabelText("Filtrar por status"),
			"na_fila",
		);
		await usuario.selectOptions(
			screen.getByLabelText("Filtrar por livro"),
			"5",
		);
		await screen.findByText("Nenhuma reserva encontrada.");

		const urls = fetch.mock.calls.map(([url]) => url);
		expect(urls).toContain(
			"http://api.teste/reservas?livro_id=5&status=na_fila",
		);
	});

	it("cancela a reserva e recarrega a lista", async () => {
		const usuario = userEvent.setup();
		let lista = [RESERVAS[1]];
		simularApi({
			"GET /reservas": () => resposta(lista),
			"GET /livros": [LIVRO],
			"GET /leitores": LEITORES,
			"DELETE /reservas/2": () => {
				lista = [
					{ ...RESERVAS[1], status: "cancelada", posicao_na_fila: null },
				];
				return resposta(undefined, 204);
			},
		});
		render(<ReservasPage />);

		await usuario.click(
			await screen.findByRole("button", {
				name: "Cancelar reserva de Carla Mendes para Clean Code",
			}),
		);

		expect(await screen.findByRole("status")).toHaveTextContent(
			"Reserva cancelada.",
		);
		expect(await screen.findAllByText("Cancelada")).not.toHaveLength(0);
	});

	it("mostra o 409 de quem tenta entrar na fila com exemplar disponível", async () => {
		const usuario = userEvent.setup();
		simularApi({
			"GET /reservas": [],
			"GET /livros": [LIVRO],
			"GET /leitores": LEITORES,
			"POST /reservas": resposta(
				{
					detail:
						"Há exemplar disponível deste livro. Faça o empréstimo direto, sem reserva.",
				},
				409,
			),
		});
		render(<ReservasPage />);
		await screen.findByRole("option", { name: "Ana Souza" });

		await usuario.selectOptions(screen.getByLabelText("Livro"), "5");
		await usuario.selectOptions(screen.getByLabelText("Leitor"), "1");
		await usuario.click(screen.getByRole("button", { name: "Entrar na fila" }));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Faça o empréstimo direto, sem reserva.",
		);
	});
});
