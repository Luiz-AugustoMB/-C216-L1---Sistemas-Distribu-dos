import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react(), tailwindcss()],

	// O .env fica na raiz do projeto, junto do compose. Só as variáveis com prefixo
	// VITE_ chegam ao navegador, as senhas do banco não
	envDir: "..",

	// A porta é a origem liberada no CORS: sem strictPort o Vite mudaria de porta sozinho
	// e o navegador bloquearia as chamadas à API
	server: { port: 5173, strictPort: true },

	test: {
		environment: "jsdom",
		setupFiles: "./tests/setup.js",
		include: ["tests/**/*.test.{js,jsx}"],
		// Os testes de página digitam campo a campo; com os arquivos rodando em paralelo
		// numa máquina lenta, o padrão de 5s estoura sem haver erro no teste
		testTimeout: 15000,
		env: {
			// O fetch é sempre simulado nos testes: esta URL nunca recebe requisição
			VITE_API_URL: "http://api.teste",
			// Fuso do Brasil, para o teste de datas pegar o erro do dia anterior
			TZ: "America/Sao_Paulo",
		},
	},
});
