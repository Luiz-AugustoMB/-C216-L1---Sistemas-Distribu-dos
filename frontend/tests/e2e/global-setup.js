import { execFileSync } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { VARIAVEIS_COMPOSE } from "./ambiente.js";

const RAIZ_DO_PROJETO = fileURLToPath(new URL("../../../", import.meta.url));

function compose(...argumentos) {
	execFileSync("docker", ["compose", "-p", "c216-e2e", ...argumentos], {
		cwd: RAIZ_DO_PROJETO,
		env: { ...process.env, ...VARIAVEIS_COMPOSE },
		stdio: "inherit",
	});
}

// O -v apaga o volume do banco de teste, então cada execução começa do zero
function derrubarStack() {
	compose("down", "-v");
}

// A função retornada é o teardown do Playwright, que roda mesmo com teste falhando
export default function globalSetup() {
	try {
		compose("up", "-d", "--build", "--wait");
	} catch (erro) {
		// Sem este try, uma falha no down (Docker fechado) esconderia a causa real
		try {
			derrubarStack();
		} catch (erroLimpeza) {
			console.error("Falha ao derrubar a stack:", erroLimpeza.message);
		}
		throw erro;
	}
	return derrubarStack;
}
