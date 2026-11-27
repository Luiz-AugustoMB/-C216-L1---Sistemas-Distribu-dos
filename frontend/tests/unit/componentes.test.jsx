import {
	act,
	render,
	renderHook,
	screen,
	waitFor,
} from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Cabecalho } from "../../src/components/Cabecalho";
import { Campo } from "../../src/components/Campo";
import { Carregando } from "../../src/components/Carregando";
import { Mensagem } from "../../src/components/Mensagem";
import { useDados } from "../../src/hooks/useDados";
import { lerRota, useRotaHash } from "../../src/hooks/useRotaHash";
import { situacaoDaReserva } from "../../src/pages/ReservasPage";

describe("useDados", () => {
	it("ignora a resposta atrasada de um filtro antigo", async () => {
		const pendentes = {};
		const buscar = (filtro) =>
			new Promise((resolver) => {
				pendentes[filtro] = resolver;
			});
		const { result, rerender } = renderHook(
			({ filtro }) => useDados(() => buscar(filtro), filtro),
			{ initialProps: { filtro: "antigo" } },
		);

		rerender({ filtro: "novo" });
		await act(async () => pendentes.novo(["resultado novo"]));
		await act(async () => pendentes.antigo(["resultado antigo"]));

		await waitFor(() => expect(result.current.carregando).toBe(false));
		expect(result.current.dados).toEqual(["resultado novo"]);
	});
});

describe("situacaoDaReserva", () => {
	it("não mostra posição vazia para quem está na fila", () => {
		expect(
			situacaoDaReserva({ status: "na_fila", posicao_na_fila: null }),
		).toBe("Na fila");
	});
});

describe("Cabecalho", () => {
	it("tem um link por tela e marca a tela atual", () => {
		render(<Cabecalho rotaAtual="reservas" />);

		const navegacao = screen.getByRole("navigation", { name: "Principal" });
		const links = navegacao.querySelectorAll("a");
		expect([...links].map((link) => link.getAttribute("href"))).toEqual([
			"#/livros",
			"#/leitores",
			"#/emprestimos",
			"#/reservas",
			"#/painel",
		]);
		expect(screen.getByRole("link", { name: "Reservas" })).toHaveAttribute(
			"aria-current",
			"page",
		);
		expect(screen.getByRole("link", { name: "Livros" })).not.toHaveAttribute(
			"aria-current",
		);
	});
});

describe("Mensagem", () => {
	it("mostra erro como alerta", () => {
		render(<Mensagem tipo="erro" texto="Livro não encontrado." />);

		expect(screen.getByRole("alert")).toHaveTextContent(
			"Livro não encontrado.",
		);
	});

	it("mostra sucesso como status", () => {
		render(<Mensagem tipo="sucesso" texto="Livro cadastrado." />);

		expect(screen.getByRole("status")).toHaveTextContent("Livro cadastrado.");
	});

	it("não mostra nada sem texto", () => {
		const { container } = render(<Mensagem texto={null} />);

		expect(container).toBeEmptyDOMElement();
	});
});

describe("Carregando", () => {
	it("mostra o texto informado", () => {
		render(<Carregando texto="Carregando livros..." />);

		expect(screen.getByText("Carregando livros...")).toBeInTheDocument();
	});
});

describe("Campo", () => {
	it("liga o rótulo ao campo e o erro à descrição", () => {
		render(<Campo rotulo="ISBN" erro="O ISBN deve ter 10 ou 13 dígitos." />);

		const campo = screen.getByLabelText("ISBN");
		expect(campo).toHaveAttribute("aria-invalid", "true");
		expect(campo).toHaveAccessibleDescription(
			"O ISBN deve ter 10 ou 13 dígitos.",
		);
	});

	it("vira select quando recebe opções", () => {
		render(
			<Campo rotulo="Livro">
				<option value="1">Redes</option>
			</Campo>,
		);

		expect(screen.getByLabelText("Livro").tagName).toBe("SELECT");
	});
});

describe("rota pelo hash", () => {
	it.each([
		["#/reservas", "reservas"],
		["#/painel", "painel"],
		["", "livros"],
		["#/nao-existe", "livros"],
	])("%s abre %s", (hash, esperado) => {
		expect(lerRota(hash)).toBe(esperado);
	});

	it("acompanha a mudança do hash", () => {
		window.location.hash = "#/leitores";
		const { result } = renderHook(() => useRotaHash());
		expect(result.current).toBe("leitores");

		act(() => {
			window.location.hash = "#/painel";
			window.dispatchEvent(new HashChangeEvent("hashchange"));
		});

		expect(result.current).toBe("painel");
	});
});
