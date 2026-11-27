import { request } from "./api";

export function listarReservas({ livro_id, leitor_id, status } = {}) {
	return request("/reservas", { params: { livro_id, leitor_id, status } });
}

export function criarReserva({ livro_id, leitor_id }) {
	return request("/reservas", {
		method: "POST",
		body: { livro_id, leitor_id },
	});
}

export function cancelarReserva(id) {
	return request(`/reservas/${id}`, { method: "DELETE" });
}
