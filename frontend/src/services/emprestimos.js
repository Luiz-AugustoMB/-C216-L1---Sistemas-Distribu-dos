import { request } from "./api";

export function listarEmprestimos({ status, livro_id, leitor_id } = {}) {
	return request("/emprestimos", { params: { status, livro_id, leitor_id } });
}

export function criarEmprestimo({ livro_id, leitor_id }) {
	return request("/emprestimos", {
		method: "POST",
		body: { livro_id, leitor_id },
	});
}

export function devolverEmprestimo(id) {
	return request(`/emprestimos/${id}/devolucao`, { method: "POST" });
}

export function renovarEmprestimo(id) {
	return request(`/emprestimos/${id}/renovacao`, { method: "POST" });
}
