import { useState } from "react";
import { FiltroTarefas } from "../components/FiltroTarefas.jsx";
import { TarefaForm } from "../components/TarefaForm.jsx";
import { TarefaLista } from "../components/TarefaLista.jsx";

function filtrarTarefas(tarefas, filtro) {
	if (filtro === "pendentes") {
		return tarefas.filter((tarefa) => !tarefa.concluida);
	}
	if (filtro === "concluidas") {
		return tarefas.filter((tarefa) => tarefa.concluida);
	}
	return tarefas;
}

export function TarefasPage() {
	const [tarefas, setTarefas] = useState([]);
	// Ids sequenciais e nunca reaproveitados, como o id gerado pelo banco
	const [proximoId, setProximoId] = useState(1);
	const [filtro, setFiltro] = useState("todas");
	const [editandoId, setEditandoId] = useState(null);

	const tarefaEmEdicao = tarefas.find((tarefa) => tarefa.id === editandoId);
	const pendentes = tarefas.filter((tarefa) => !tarefa.concluida).length;

	function criarTarefa(dados) {
		setTarefas((atuais) => [
			...atuais,
			{ id: proximoId, ...dados, concluida: false },
		]);
		setProximoId((id) => id + 1);
	}

	function atualizarTarefa(dados) {
		setTarefas((atuais) =>
			atuais.map((tarefa) =>
				tarefa.id === editandoId ? { ...tarefa, ...dados } : tarefa,
			),
		);
		setEditandoId(null);
	}

	function alternarTarefa(id) {
		setTarefas((atuais) =>
			atuais.map((tarefa) =>
				tarefa.id === id ? { ...tarefa, concluida: !tarefa.concluida } : tarefa,
			),
		);
	}

	function removerTarefa(id) {
		setTarefas((atuais) => atuais.filter((tarefa) => tarefa.id !== id));
		if (id === editandoId) {
			setEditandoId(null);
		}
	}

	return (
		<main className="mx-auto max-w-2xl space-y-6 px-4 py-10">
			<header>
				<h1 className="text-3xl font-bold text-slate-900">Tarefas</h1>
				<p className="mt-1 text-slate-500" aria-live="polite">
					{pendentes} pendente(s) de {tarefas.length} tarefa(s)
				</p>
			</header>

			{/* A key troca ao mudar de tarefa, recriando o formulário com os dados certos */}
			<TarefaForm
				key={tarefaEmEdicao?.id ?? "nova"}
				tarefa={tarefaEmEdicao}
				onSalvar={tarefaEmEdicao ? atualizarTarefa : criarTarefa}
				onCancelar={() => setEditandoId(null)}
			/>

			<section className="space-y-4">
				<FiltroTarefas filtro={filtro} onFiltrar={setFiltro} />
				<TarefaLista
					tarefas={filtrarTarefas(tarefas, filtro)}
					editandoId={editandoId}
					onAlternar={alternarTarefa}
					onEditar={setEditandoId}
					onRemover={removerTarefa}
				/>
			</section>
		</main>
	);
}
