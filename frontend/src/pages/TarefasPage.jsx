import { useCallback, useEffect, useRef, useState } from "react";
import { FiltroTarefas } from "../components/FiltroTarefas.jsx";
import { MensagemErro } from "../components/MensagemErro.jsx";
import { TarefaForm } from "../components/TarefaForm.jsx";
import { TarefaLista } from "../components/TarefaLista.jsx";
import {
	atualizarTarefaParcial,
	buscarTarefa,
	criarTarefa,
	listarTarefas,
	removerTarefa,
	substituirTarefa,
} from "../services/tarefaService.js";

// Valor do query parameter ?concluida= de cada filtro; "todas" não filtra
const CONCLUIDA_POR_FILTRO = { pendentes: false, concluidas: true };

function trocarTarefa(tarefas, atualizada) {
	return tarefas.map((tarefa) =>
		tarefa.id === atualizada.id ? atualizada : tarefa,
	);
}

export function TarefasPage() {
	// Lista completa: alimenta o contador do cabeçalho e o filtro "Todas"
	const [tarefas, setTarefas] = useState([]);
	const [filtro, setFiltro] = useState("todas");
	// Resposta do GET /tarefas?concluida= para os outros filtros; null enquanto carrega
	const [filtradas, setFiltradas] = useState(null);
	const [erroFiltro, setErroFiltro] = useState(null);
	// Descarta respostas de um filtro que o usuário já trocou
	const filtroAtual = useRef("todas");
	const [editandoId, setEditandoId] = useState(null);
	const [carregando, setCarregando] = useState(true);
	const [salvando, setSalvando] = useState(false);
	// Separados porque falhar ao carregar esconde a lista; falhar em uma operação, não
	const [erroCarregamento, setErroCarregamento] = useState(null);
	const [erroOperacao, setErroOperacao] = useState(null);

	const tarefaEmEdicao = tarefas.find((tarefa) => tarefa.id === editandoId);
	const pendentes = tarefas.filter((tarefa) => !tarefa.concluida).length;

	const carregarTarefas = useCallback(async () => {
		setCarregando(true);
		setErroCarregamento(null);
		try {
			setTarefas(await listarTarefas());
		} catch (erro) {
			setErroCarregamento(erro.message);
		} finally {
			setCarregando(false);
		}
	}, []);

	useEffect(() => {
		carregarTarefas();
	}, [carregarTarefas]);

	async function carregarFiltradas(valor) {
		if (valor === "todas") {
			return;
		}
		try {
			const resultado = await listarTarefas(CONCLUIDA_POR_FILTRO[valor]);
			if (filtroAtual.current === valor) {
				setFiltradas(resultado);
			}
		} catch (erro) {
			// A lista filtrada que estava na tela pode estar velha, então dá lugar ao erro
			if (filtroAtual.current === valor) {
				setFiltradas(null);
				setErroFiltro(erro.message);
			}
		}
	}

	function filtrar(valor) {
		filtroAtual.current = valor;
		setFiltro(valor);
		setFiltradas(null);
		setErroFiltro(null);
		setErroOperacao(null);
		carregarFiltradas(valor);
	}

	// Retorna se deu certo, para o formulário só limpar os campos após salvar de fato
	async function executar(operacao) {
		setSalvando(true);
		setErroOperacao(null);
		try {
			await operacao();
			// Uma tarefa concluída ou criada pode entrar ou sair do filtro ativo
			carregarFiltradas(filtroAtual.current);
			return true;
		} catch (erro) {
			setErroOperacao(erro.message);
			// 404: a tarefa sumiu por fora (outra aba, por exemplo) e a lista está velha
			if (erro.status === 404) {
				carregarTarefas();
				carregarFiltradas(filtroAtual.current);
			}
			return false;
		} finally {
			setSalvando(false);
		}
	}

	function salvarNova(dados) {
		return executar(async () => {
			const criada = await criarTarefa(dados);
			setTarefas((atuais) => [...atuais, criada]);
			setEditandoId(null);
		});
	}

	// O formulário tem todos os campos da tarefa, então o PUT substitui ela inteira
	function salvarEdicao(dados) {
		return executar(async () => {
			const atualizada = await substituirTarefa(editandoId, {
				...dados,
				concluida: tarefaEmEdicao.concluida,
			});
			setTarefas((atuais) => trocarTarefa(atuais, atualizada));
			setEditandoId(null);
		});
	}

	// O checkbox muda um único campo, que é o caso do PATCH
	function alternarConcluida(id) {
		const tarefa = tarefas.find((atual) => atual.id === id);
		return executar(async () => {
			const atualizada = await atualizarTarefaParcial(id, {
				concluida: !tarefa.concluida,
			});
			setTarefas((atuais) => trocarTarefa(atuais, atualizada));
		});
	}

	// Busca a versão atual para não abrir o formulário com dados velhos da lista
	function iniciarEdicao(id) {
		return executar(async () => {
			const atual = await buscarTarefa(id);
			setTarefas((atuais) => trocarTarefa(atuais, atual));
			setEditandoId(id);
		});
	}

	function remover(id) {
		return executar(async () => {
			await removerTarefa(id);
			setTarefas((atuais) => atuais.filter((tarefa) => tarefa.id !== id));
			if (id === editandoId) {
				setEditandoId(null);
			}
		});
	}

	function renderizarResumo() {
		if (carregando) {
			return "Carregando tarefas...";
		}
		if (erroCarregamento) {
			return null;
		}
		if (salvando) {
			return "Salvando...";
		}
		return `${pendentes} pendente(s) de ${tarefas.length} tarefa(s)`;
	}

	function renderizarLista() {
		const visiveis = filtro === "todas" ? tarefas : filtradas;
		if (erroCarregamento) {
			return (
				<MensagemErro
					onTentarNovamente={() => {
						setErroOperacao(null);
						carregarTarefas();
						filtrar(filtro);
					}}
				>
					{erroCarregamento}
				</MensagemErro>
			);
		}
		if (erroFiltro) {
			return (
				<MensagemErro onTentarNovamente={() => filtrar(filtro)}>
					{erroFiltro}
				</MensagemErro>
			);
		}
		if (carregando || visiveis === null) {
			return (
				<p className="p-8 text-center text-slate-500">Carregando tarefas...</p>
			);
		}
		return (
			<TarefaLista
				tarefas={visiveis}
				editandoId={editandoId}
				desabilitado={salvando}
				onAlternar={alternarConcluida}
				onEditar={iniciarEdicao}
				onRemover={remover}
			/>
		);
	}

	return (
		<main className="mx-auto max-w-2xl space-y-6 px-4 py-10">
			<header>
				<h1 className="text-3xl font-bold text-slate-900">Tarefas</h1>
				<p className="mt-1 min-h-6 text-slate-500" aria-live="polite">
					{renderizarResumo()}
				</p>
			</header>

			{/* Sticky: quem clica em um item no fim da lista também precisa ver o erro */}
			{erroOperacao && (
				<div className="sticky top-4 z-10">
					<MensagemErro>{erroOperacao}</MensagemErro>
				</div>
			)}

			{/* A key troca ao mudar de tarefa, recriando o formulário com os dados certos.
			    Usa editandoId: se a tarefa sumir (404), o texto digitado continua no formulário.
			    Sem a lista carregada, cadastrar geraria um sucesso invisível ou uma duplicata. */}
			<TarefaForm
				key={editandoId ?? "nova"}
				tarefa={tarefaEmEdicao}
				desabilitado={salvando || carregando || erroCarregamento !== null}
				onSalvar={tarefaEmEdicao ? salvarEdicao : salvarNova}
				onCancelar={() => {
					setEditandoId(null);
					setErroOperacao(null);
				}}
			/>

			<section className="space-y-4">
				<FiltroTarefas filtro={filtro} onFiltrar={filtrar} />
				{renderizarLista()}
			</section>
		</main>
	);
}
