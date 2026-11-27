import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	criarEmprestimo,
	devolverEmprestimo,
	listarEmprestimos,
	renovarEmprestimo,
} from "../../src/services/emprestimos";
import {
	atualizarLeitor,
	criarLeitor,
	excluirLeitor,
	listarEmprestimosDoLeitor,
	listarLeitores,
} from "../../src/services/leitores";
import {
	atualizarLivro,
	criarLivro,
	excluirLivro,
	listarLivros,
} from "../../src/services/livros";
import { obterPainel } from "../../src/services/painel";
import {
	cancelarReserva,
	criarReserva,
	listarReservas,
} from "../../src/services/reservas";
import { resposta } from "../apoio";

let fetch;

beforeEach(() => {
	fetch = vi.fn(async () => resposta({}));
	vi.stubGlobal("fetch", fetch);
});

// URL, método e corpo da única chamada feita
function chamada() {
	expect(fetch).toHaveBeenCalledTimes(1);
	const [url, opcoes] = fetch.mock.calls[0];
	return {
		url: url.replace("http://api.teste", ""),
		metodo: opcoes.method,
		corpo: opcoes.body === undefined ? undefined : JSON.parse(opcoes.body),
	};
}

const LIVRO = {
	titulo: "Redes",
	autor: "Kurose",
	isbn: "9780133594140",
	ano: 2016,
	exemplares: 2,
};

describe("serviços", () => {
	it.each([
		[
			"listar livros com busca e disponível",
			() => listarLivros({ busca: "redes", disponivel: true }),
			{ url: "/livros?busca=redes&disponivel=true", metodo: "GET" },
		],
		[
			"listar livros sem filtro",
			() => listarLivros(),
			{ url: "/livros", metodo: "GET" },
		],
		[
			"cadastrar livro",
			() => criarLivro(LIVRO),
			{ url: "/livros", metodo: "POST", corpo: LIVRO },
		],
		[
			"atualizar livro",
			() => atualizarLivro(3, LIVRO),
			{ url: "/livros/3", metodo: "PUT", corpo: LIVRO },
		],
		[
			"excluir livro",
			() => excluirLivro(3),
			{ url: "/livros/3", metodo: "DELETE" },
		],
		[
			"listar leitores com busca",
			() => listarLeitores({ busca: "ana" }),
			{ url: "/leitores?busca=ana", metodo: "GET" },
		],
		[
			"cadastrar leitor",
			() => criarLeitor({ nome: "Ana", email: "ana@exemplo.com" }),
			{
				url: "/leitores",
				metodo: "POST",
				corpo: { nome: "Ana", email: "ana@exemplo.com" },
			},
		],
		[
			"atualizar leitor",
			() => atualizarLeitor(2, { nome: "Ana", email: "ana@exemplo.com" }),
			{
				url: "/leitores/2",
				metodo: "PUT",
				corpo: { nome: "Ana", email: "ana@exemplo.com" },
			},
		],
		[
			"excluir leitor",
			() => excluirLeitor(2),
			{ url: "/leitores/2", metodo: "DELETE" },
		],
		[
			"empréstimos do leitor",
			() => listarEmprestimosDoLeitor(2),
			{ url: "/leitores/2/emprestimos", metodo: "GET" },
		],
		[
			"listar empréstimos por status",
			() => listarEmprestimos({ status: "atrasado" }),
			{ url: "/emprestimos?status=atrasado", metodo: "GET" },
		],
		[
			"novo empréstimo",
			() => criarEmprestimo({ livro_id: 1, leitor_id: 2 }),
			{
				url: "/emprestimos",
				metodo: "POST",
				corpo: { livro_id: 1, leitor_id: 2 },
			},
		],
		[
			"devolver",
			() => devolverEmprestimo(5),
			{ url: "/emprestimos/5/devolucao", metodo: "POST" },
		],
		[
			"renovar",
			() => renovarEmprestimo(5),
			{ url: "/emprestimos/5/renovacao", metodo: "POST" },
		],
		[
			"listar reservas por livro e status",
			() => listarReservas({ livro_id: 1, status: "na_fila" }),
			{ url: "/reservas?livro_id=1&status=na_fila", metodo: "GET" },
		],
		[
			"entrar na fila",
			() => criarReserva({ livro_id: 1, leitor_id: 2 }),
			{
				url: "/reservas",
				metodo: "POST",
				corpo: { livro_id: 1, leitor_id: 2 },
			},
		],
		[
			"cancelar reserva",
			() => cancelarReserva(7),
			{ url: "/reservas/7", metodo: "DELETE" },
		],
		["painel", () => obterPainel(), { url: "/painel", metodo: "GET" }],
	])("%s", async (_nome, executar, esperado) => {
		await executar();

		expect(chamada()).toEqual({ corpo: undefined, ...esperado });
	});
});
