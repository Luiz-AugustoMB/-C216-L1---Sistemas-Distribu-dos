import { request } from "./api";

export function listarLeitores({ busca } = {}) {
	return request("/leitores", { params: { busca } });
}

export function criarLeitor(dados) {
	return request("/leitores", { method: "POST", body: dados });
}

export function atualizarLeitor(id, dados) {
	return request(`/leitores/${id}`, { method: "PUT", body: dados });
}

export function excluirLeitor(id) {
	return request(`/leitores/${id}`, { method: "DELETE" });
}

export function listarEmprestimosDoLeitor(id) {
	return request(`/leitores/${id}/emprestimos`);
}
