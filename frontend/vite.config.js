import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react(), tailwindcss()],

	// Porta fixa porque é a origem liberada no CORS: sem strictPort, o Vite trocaria
	// de porta em silêncio e toda chamada à API seria bloqueada pelo navegador
	server: { port: 5173, strictPort: true },
	preview: { port: 5173, strictPort: true },

	test: {
		environment: "jsdom",
		// O fetch é sempre simulado nos testes, esta URL nunca recebe requisição
		env: { VITE_API_URL: "http://api.teste" },
		setupFiles: "./tests/setup.js",
		// Folga para a primeira execução em máquinas lentas (jsdom a frio)
		testTimeout: 15000,
		// Só unitários e integração: os *.spec.js de tests/e2e são do Playwright
		// e quebram se o Vitest tentar executá-los
		include: [
			"tests/unit/**/*.test.{js,jsx}",
			"tests/integration/**/*.test.{js,jsx}",
		],
	},
});
