import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react(), tailwindcss()],

	test: {
		environment: "jsdom",
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
