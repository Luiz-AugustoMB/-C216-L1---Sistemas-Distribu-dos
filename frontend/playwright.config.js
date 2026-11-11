import process from "node:process";
import { defineConfig, devices } from "@playwright/test";
import { FRONTEND_URL } from "./tests/e2e/ambiente.js";

export default defineConfig({
	testDir: "./tests/e2e",
	// Os testes usam o mesmo banco e limpam as tarefas antes de cada um,
	// então não podem rodar em paralelo
	fullyParallel: false,
	workers: 1,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: [["list"], ["html", { open: "never" }]],
	globalSetup: "./tests/e2e/global-setup.js",

	use: {
		baseURL: FRONTEND_URL,
		trace: "on-first-retry",
	},

	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
});
