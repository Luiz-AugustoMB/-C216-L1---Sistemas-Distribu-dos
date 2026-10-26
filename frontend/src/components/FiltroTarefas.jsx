// Equivalente no frontend ao query parameter ?concluida= do GET /tarefas
export const FILTROS = [
	{ valor: "todas", rotulo: "Todas" },
	{ valor: "pendentes", rotulo: "Pendentes" },
	{ valor: "concluidas", rotulo: "Concluídas" },
];

export function FiltroTarefas({ filtro, onFiltrar }) {
	return (
		<fieldset className="flex gap-2">
			<legend className="sr-only">Filtrar tarefas</legend>
			{FILTROS.map(({ valor, rotulo }) => (
				<button
					key={valor}
					type="button"
					onClick={() => onFiltrar(valor)}
					aria-pressed={filtro === valor}
					className={`rounded-full px-3 py-1 text-sm font-medium ${
						filtro === valor
							? "bg-indigo-600 text-white"
							: "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
					}`}
				>
					{rotulo}
				</button>
			))}
		</fieldset>
	);
}
