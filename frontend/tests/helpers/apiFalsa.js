import { vi } from "vitest";

function json(corpo, status = 200) {
	return new Response(JSON.stringify(corpo), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

// Substitui o fetch global por um backend em memória com as mesmas rotas de
// /tarefas. Assim os testes passam pela página, pelo serviço e pelo request sem
// depender da API nem do banco.
export function instalarApiFalsa(tarefasIniciais = []) {
	let tarefas = tarefasIniciais.map((tarefa) => ({ ...tarefa }));
	let proximoId = Math.max(0, ...tarefas.map(({ id }) => id)) + 1;
	let proximaFalha = null;
	const chamadas = [];

	function responder(metodo, url, corpo) {
		const { pathname, searchParams } = new URL(url);
		const id = Number(pathname.split("/")[2]);
		const tarefa = tarefas.find((atual) => atual.id === id);

		if (pathname === "/tarefas" && metodo === "GET") {
			const concluida = searchParams.get("concluida");
			return json(
				concluida === null
					? tarefas
					: tarefas.filter((atual) => String(atual.concluida) === concluida),
			);
		}
		if (pathname === "/tarefas" && metodo === "POST") {
			const criada = { id: proximoId++, concluida: false, ...corpo };
			tarefas.push(criada);
			return json(criada, 201);
		}
		if (!tarefa) {
			return json({ detail: "Tarefa não encontrada" }, 404);
		}
		if (metodo === "GET") {
			return json(tarefa);
		}
		if (metodo === "DELETE") {
			tarefas = tarefas.filter((atual) => atual.id !== id);
			return new Response(null, { status: 204 });
		}
		Object.assign(tarefa, corpo);
		return json(tarefa);
	}

	const fetchFalso = vi.fn(async (url, { method = "GET", body } = {}) => {
		const corpo = body ? JSON.parse(body) : undefined;
		chamadas.push({ metodo: method, url, corpo });

		if (proximaFalha) {
			const falha = proximaFalha;
			proximaFalha = null;
			return falha();
		}
		return responder(method, url, corpo);
	});
	vi.stubGlobal("fetch", fetchFalso);

	return {
		chamadas,
		// Afeta só a próxima requisição, como uma falha passageira
		falharComDetail(status, detail) {
			proximaFalha = () => json({ detail }, status);
		},
		foraDoAr() {
			proximaFalha = () => {
				throw new TypeError("Failed to fetch");
			};
		},
		// Simula outra aba removendo a tarefa sem a página saber
		removerPorFora(id) {
			tarefas = tarefas.filter((atual) => atual.id !== id);
		},
		// Segura as respostas até liberar(), para observar o estado de carregamento
		segurarRespostas() {
			let liberar;
			const espera = new Promise((resolve) => {
				liberar = resolve;
			});
			const original = fetchFalso.getMockImplementation();
			fetchFalso.mockImplementation(async (...args) => {
				await espera;
				return original(...args);
			});
			return liberar;
		},
	};
}
