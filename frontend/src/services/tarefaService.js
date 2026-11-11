import { request } from "./api.js";

const RECURSO = "/tarefas";

export function listarTarefas(concluida) {
	const filtro = concluida === undefined ? "" : `?concluida=${concluida}`;
	return request(`${RECURSO}${filtro}`);
}

export function buscarTarefa(id) {
	return request(`${RECURSO}/${id}`);
}

export function criarTarefa(dados) {
	return request(RECURSO, { method: "POST", body: dados });
}

export function substituirTarefa(id, dados) {
	return request(`${RECURSO}/${id}`, { method: "PUT", body: dados });
}

export function atualizarTarefaParcial(id, campos) {
	return request(`${RECURSO}/${id}`, { method: "PATCH", body: campos });
}

export function removerTarefa(id) {
	return request(`${RECURSO}/${id}`, { method: "DELETE" });
}
