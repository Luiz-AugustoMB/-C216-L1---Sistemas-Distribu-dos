import { request } from "./api";

export function listarLivros({ busca, disponivel } = {}) {
	return request("/livros", { params: { busca, disponivel } });
}

export function criarLivro(dados) {
	return request("/livros", { method: "POST", body: dados });
}

export function atualizarLivro(id, dados) {
	return request(`/livros/${id}`, { method: "PUT", body: dados });
}

export function excluirLivro(id) {
	return request(`/livros/${id}`, { method: "DELETE" });
}
