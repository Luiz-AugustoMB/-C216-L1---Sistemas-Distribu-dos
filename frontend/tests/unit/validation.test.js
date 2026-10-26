import { describe, expect, it } from "vitest";
import {
	contarCaracteres,
	DESCRICAO_MAX,
	TITULO_MAX,
	temErros,
	validarDescricao,
	validarTarefa,
	validarTitulo,
} from "../../src/validation.js";

describe("contarCaracteres", () => {
	it("ignora espaços nas pontas", () => {
		expect(contarCaracteres("  abc  ")).toBe(3);
	});

	it("conta emoji como um caractere, como o Pydantic", () => {
		expect("🚀".length).toBe(2);
		expect(contarCaracteres("🚀")).toBe(1);
	});

	it("trata ausência como zero", () => {
		expect(contarCaracteres(undefined)).toBe(0);
	});
});

describe("validarTitulo", () => {
	it("aceita um título válido", () => {
		expect(validarTitulo("Estudar React")).toBeNull();
	});

	it("rejeita título vazio", () => {
		expect(validarTitulo("")).toBe("O título é obrigatório.");
	});

	it("rejeita título só com espaços", () => {
		expect(validarTitulo("   ")).toBe("O título é obrigatório.");
	});

	it("rejeita título ausente", () => {
		expect(validarTitulo(undefined)).toBe("O título é obrigatório.");
	});

	it("aceita título com exatamente o limite de caracteres", () => {
		expect(validarTitulo("a".repeat(TITULO_MAX))).toBeNull();
	});

	it("rejeita título acima do limite", () => {
		expect(validarTitulo("a".repeat(TITULO_MAX + 1))).toBe(
			`O título deve ter no máximo ${TITULO_MAX} caracteres.`,
		);
	});

	it("aceita 100 emojis, que o backend também aceita", () => {
		expect(validarTitulo("🚀".repeat(TITULO_MAX))).toBeNull();
		expect(validarTitulo("🚀".repeat(TITULO_MAX + 1))).not.toBeNull();
	});

	it("ignora espaços nas pontas ao contar o tamanho", () => {
		expect(validarTitulo(`  ${"a".repeat(TITULO_MAX)}  `)).toBeNull();
	});
});

describe("validarDescricao", () => {
	it("aceita descrição vazia, pois é opcional", () => {
		expect(validarDescricao("")).toBeNull();
		expect(validarDescricao(undefined)).toBeNull();
	});

	it("aceita descrição com exatamente o limite de caracteres", () => {
		expect(validarDescricao("a".repeat(DESCRICAO_MAX))).toBeNull();
	});

	it("rejeita descrição acima do limite", () => {
		expect(validarDescricao("a".repeat(DESCRICAO_MAX + 1))).toBe(
			`A descrição deve ter no máximo ${DESCRICAO_MAX} caracteres.`,
		);
	});
});

describe("validarTarefa", () => {
	it("retorna objeto vazio quando a tarefa é válida", () => {
		expect(validarTarefa({ titulo: "Ler", descricao: "" })).toEqual({});
	});

	it("retorna apenas os campos inválidos", () => {
		const erros = validarTarefa({ titulo: "", descricao: "ok" });

		expect(erros).toEqual({ titulo: "O título é obrigatório." });
	});

	it("acumula erros de mais de um campo", () => {
		const erros = validarTarefa({
			titulo: " ",
			descricao: "a".repeat(DESCRICAO_MAX + 1),
		});

		expect(Object.keys(erros)).toEqual(["titulo", "descricao"]);
	});
});

describe("temErros", () => {
	it("é falso para objeto vazio", () => {
		expect(temErros({})).toBe(false);
	});

	it("é verdadeiro quando há algum erro", () => {
		expect(temErros({ titulo: "erro" })).toBe(true);
	});
});
