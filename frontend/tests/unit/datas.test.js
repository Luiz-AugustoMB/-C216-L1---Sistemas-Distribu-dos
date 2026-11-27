import { describe, expect, it } from "vitest";
import { formatarData, formatarDataHora } from "../../src/utils/datas";

describe("formatarData", () => {
	it("mostra a data como dd/mm/aaaa", () => {
		expect(formatarData("2026-03-16")).toBe("16/03/2026");
	});

	// Os testes rodam no fuso de São Paulo (vite.config.js). Com new Date("2026-01-01")
	// a data sairia como 31/12/2025: este teste pega esse erro
	it("não volta um dia no fuso do Brasil", () => {
		expect(formatarData("2026-01-01")).toBe("01/01/2026");
		expect(new Date("2026-01-01").toLocaleDateString("pt-BR")).toBe(
			"31/12/2025",
		);
	});

	it("mostra traço quando não há data", () => {
		expect(formatarData(null)).toBe("-");
		expect(formatarData(undefined)).toBe("-");
	});
});

describe("formatarDataHora", () => {
	it("converte o horário UTC da API para o horário de São Paulo", () => {
		expect(formatarDataHora("2026-11-27T01:51:50Z")).toBe("26/11/2026, 22:51");
	});

	it("mostra traço quando não há data", () => {
		expect(formatarDataHora(null)).toBe("-");
	});
});
