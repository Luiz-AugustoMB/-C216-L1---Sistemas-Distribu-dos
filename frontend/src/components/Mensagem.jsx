const ESTILOS = {
	erro: "border-red-300 bg-red-50 text-red-800",
	sucesso: "border-green-300 bg-green-50 text-green-800",
};

// Erro usa role="alert" para o leitor de tela anunciar na hora; sucesso só informa
export function Mensagem({ tipo = "erro", texto }) {
	if (!texto) {
		return null;
	}
	return (
		<p
			role={tipo === "erro" ? "alert" : "status"}
			className={`rounded border px-3 py-2 text-sm ${ESTILOS[tipo]}`}
		>
			{texto}
		</p>
	);
}
