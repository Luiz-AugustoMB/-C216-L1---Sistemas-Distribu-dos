export function TarefaItem({
	tarefa,
	emEdicao = false,
	onAlternar,
	onEditar,
	onRemover,
}) {
	return (
		<li
			aria-current={emEdicao ? "true" : undefined}
			className={`flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm ${
				emEdicao ? "ring-2 ring-indigo-500" : "ring-1 ring-slate-200"
			}`}
		>
			<input
				type="checkbox"
				checked={tarefa.concluida}
				onChange={() => onAlternar(tarefa.id)}
				aria-label={`Concluída: ${tarefa.titulo}`}
				className="mt-1 size-4 accent-indigo-600"
			/>

			<div className="min-w-0 flex-1">
				<p
					className={`font-medium wrap-break-word ${
						tarefa.concluida ? "text-slate-400 line-through" : "text-slate-800"
					}`}
				>
					{tarefa.titulo}
				</p>
				{tarefa.descricao && (
					<p className="mt-1 text-sm wrap-break-word text-slate-500">
						{tarefa.descricao}
					</p>
				)}
			</div>

			<div className="flex shrink-0 gap-1">
				<button
					type="button"
					onClick={() => onEditar(tarefa.id)}
					aria-label={`Editar ${tarefa.titulo}`}
					className="rounded-lg px-2 py-1 text-sm text-indigo-600 hover:bg-indigo-50"
				>
					Editar
				</button>
				<button
					type="button"
					onClick={() => onRemover(tarefa.id)}
					aria-label={`Remover ${tarefa.titulo}`}
					className="rounded-lg px-2 py-1 text-sm text-red-600 hover:bg-red-50"
				>
					Remover
				</button>
			</div>
		</li>
	);
}
