import { useEffect, useState } from "react";

export const ROTAS = [
	{ id: "livros", titulo: "Livros" },
	{ id: "leitores", titulo: "Leitores" },
	{ id: "emprestimos", titulo: "Empréstimos" },
	{ id: "reservas", titulo: "Reservas" },
	{ id: "painel", titulo: "Painel" },
];

// "#/reservas" vira "reservas"; qualquer coisa desconhecida cai em livros
export function lerRota(hash) {
	const id = String(hash ?? "").replace(/^#\/?/, "");
	return ROTAS.some((rota) => rota.id === id) ? id : ROTAS[0].id;
}

// Navegação pelo hash da URL: recarregar a página mantém a tela atual e não precisa de
// biblioteca de rotas nem de configuração no servidor
export function useRotaHash() {
	const [rota, setRota] = useState(() => lerRota(window.location.hash));

	useEffect(() => {
		const atualizar = () => setRota(lerRota(window.location.hash));
		window.addEventListener("hashchange", atualizar);
		return () => window.removeEventListener("hashchange", atualizar);
	}, []);

	return rota;
}
