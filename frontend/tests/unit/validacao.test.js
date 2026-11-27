import { describe, expect, it } from "vitest";
import {
	emailValido,
	isbnValido,
	validarLeitor,
	validarLivro,
} from "../../src/validacao";

const LIVRO = {
	titulo: "Redes",
	autor: "Kurose",
	isbn: "978-0-13-359414-0",
	ano: "2016",
	exemplares: "1",
};

describe("isbnValido", () => {
	it.each([
		"9780133594140",
		"978-0-13-359414-0",
		"0133594149",
		"0 13 359414 9",
	])("aceita %s", (isbn) => {
		expect(isbnValido(isbn)).toBe(true);
	});

	it.each(["123", "97801335941400", "013359414X", "abcdefghij", ""])(
		"recusa %s",
		(isbn) => {
			expect(isbnValido(isbn)).toBe(false);
		},
	);
});

describe("validarLivro", () => {
	it("não acusa nada num livro válido", () => {
		expect(validarLivro(LIVRO, 2026)).toEqual({});
	});

	it("exige título e autor, mesmo que só com espaços", () => {
		const erros = validarLivro({ ...LIVRO, titulo: "   ", autor: "" }, 2026);

		expect(Object.keys(erros).sort()).toEqual(["autor", "titulo"]);
	});

	it.each([
		["1449", true],
		["1450", false],
		["2027", false],
		["2028", true],
		["", true],
		["20.5", true],
	])("ano %s com o ano atual 2026: erro = %s", (ano, temErro) => {
		expect("ano" in validarLivro({ ...LIVRO, ano }, 2026)).toBe(temErro);
	});

	it.each([
		["0", true],
		["1", false],
		["-2", true],
		["", true],
	])("exemplares %s: erro = %s", (exemplares, temErro) => {
		expect("exemplares" in validarLivro({ ...LIVRO, exemplares }, 2026)).toBe(
			temErro,
		);
	});

	it("explica o formato do ISBN", () => {
		expect(validarLivro({ ...LIVRO, isbn: "123" }, 2026).isbn).toBe(
			"O ISBN deve ter 10 ou 13 dígitos, com ou sem hífen.",
		);
	});
});

describe("validarLeitor", () => {
	it("aceita nome e e-mail válidos", () => {
		expect(validarLeitor({ nome: "Ana", email: "ana@exemplo.com" })).toEqual(
			{},
		);
	});

	it("exige nome e e-mail", () => {
		expect(Object.keys(validarLeitor({ nome: " ", email: "" })).sort()).toEqual(
			["email", "nome"],
		);
	});

	it.each(["sem-arroba", "ana@", "ana@exemplo", "ana @exemplo.com"])(
		"recusa o e-mail %s",
		(email) => {
			expect(emailValido(email)).toBe(false);
		},
	);
});
