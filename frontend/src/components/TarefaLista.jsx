import { TarefaItem } from "./TarefaItem.jsx";

export function TarefaLista({
	tarefas,
	editandoId = null,
	onAlternar,
	onEditar,
	onRemover,
}) {
	if (tarefas.length === 0) {
		return (
			<p className="rounded-xl border-2 border-dashed border-slate-300 p-8 text-center text-slate-500">
				Nenhuma tarefa para exibir.
			</p>
		);
	}

	return (
		<ul aria-label="Lista de tarefas" className="space-y-3">
			{tarefas.map((tarefa) => (
				<TarefaItem
					key={tarefa.id}
					tarefa={tarefa}
					emEdicao={tarefa.id === editandoId}
					onAlternar={onAlternar}
					onEditar={onEditar}
					onRemover={onRemover}
				/>
			))}
		</ul>
	);
}
