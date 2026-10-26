import { useEffect, useId, useRef, useState } from "react";
import {
	contarCaracteres,
	DESCRICAO_MAX,
	TITULO_MAX,
	temErros,
	validarTarefa,
} from "../validation.js";

// Sem a prop "tarefa" cadastra uma nova; com ela, edita a existente
export function TarefaForm({ tarefa, onSalvar, onCancelar }) {
	const editando = tarefa !== undefined;
	const [titulo, setTitulo] = useState(tarefa?.titulo ?? "");
	const [descricao, setDescricao] = useState(tarefa?.descricao ?? "");
	const [erros, setErros] = useState({});

	const tituloId = useId();
	const descricaoId = useId();
	const tituloRef = useRef(null);

	// O formulário fica acima da lista: ao editar um item lá embaixo, o foco
	// rola a página até o campo, senão a edição começa fora da tela
	useEffect(() => {
		if (editando) {
			tituloRef.current.focus();
		}
	}, [editando]);

	function handleSubmit(evento) {
		evento.preventDefault();

		const novosErros = validarTarefa({ titulo, descricao });
		setErros(novosErros);
		if (temErros(novosErros)) {
			return;
		}

		// Descrição vazia vira null, como o campo opcional da API
		onSalvar({ titulo: titulo.trim(), descricao: descricao.trim() || null });

		if (!editando) {
			setTitulo("");
			setDescricao("");
		}
	}

	return (
		<form
			onSubmit={handleSubmit}
			noValidate
			aria-label={editando ? "Editar tarefa" : "Nova tarefa"}
			className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
		>
			<h2 className="text-lg font-semibold text-slate-800">
				{editando ? "Editar tarefa" : "Nova tarefa"}
			</h2>

			<div className="space-y-1">
				<label
					htmlFor={tituloId}
					className="block text-sm font-medium text-slate-700"
				>
					Título
				</label>
				<input
					ref={tituloRef}
					id={tituloId}
					type="text"
					value={titulo}
					onChange={(evento) => setTitulo(evento.target.value)}
					aria-invalid={erros.titulo ? "true" : "false"}
					aria-describedby={erros.titulo ? `${tituloId}-erro` : undefined}
					className={`w-full rounded-lg border px-3 py-2 text-slate-900 outline-none focus:ring-2 ${
						erros.titulo
							? "border-red-500 focus:ring-red-200"
							: "border-slate-300 focus:border-indigo-500 focus:ring-indigo-200"
					}`}
				/>
				<div className="flex justify-between text-xs">
					<p
						id={`${tituloId}-erro`}
						aria-live="polite"
						className="text-red-600"
					>
						{erros.titulo}
					</p>
					<span className="text-slate-400">
						{contarCaracteres(titulo)}/{TITULO_MAX}
					</span>
				</div>
			</div>

			<div className="space-y-1">
				<label
					htmlFor={descricaoId}
					className="block text-sm font-medium text-slate-700"
				>
					Descrição <span className="text-slate-400">(opcional)</span>
				</label>
				<textarea
					id={descricaoId}
					rows={3}
					value={descricao}
					onChange={(evento) => setDescricao(evento.target.value)}
					aria-invalid={erros.descricao ? "true" : "false"}
					aria-describedby={erros.descricao ? `${descricaoId}-erro` : undefined}
					className={`w-full rounded-lg border px-3 py-2 text-slate-900 outline-none focus:ring-2 ${
						erros.descricao
							? "border-red-500 focus:ring-red-200"
							: "border-slate-300 focus:border-indigo-500 focus:ring-indigo-200"
					}`}
				/>
				<div className="flex justify-between text-xs">
					<p
						id={`${descricaoId}-erro`}
						aria-live="polite"
						className="text-red-600"
					>
						{erros.descricao}
					</p>
					<span className="text-slate-400">
						{contarCaracteres(descricao)}/{DESCRICAO_MAX}
					</span>
				</div>
			</div>

			<div className="flex justify-end gap-2">
				{editando && (
					<button
						type="button"
						onClick={onCancelar}
						className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
					>
						Cancelar
					</button>
				)}
				<button
					type="submit"
					className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
				>
					{editando ? "Salvar alterações" : "Adicionar tarefa"}
				</button>
			</div>
		</form>
	);
}
