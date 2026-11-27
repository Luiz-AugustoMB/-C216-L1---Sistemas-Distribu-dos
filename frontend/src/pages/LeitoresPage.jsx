import { useState } from "react";
import { Campo } from "../components/Campo";
import { Carregando } from "../components/Carregando";
import {
	botaoPerigo,
	botaoPrimario,
	botaoSecundario,
	cartao,
	celula,
	tabela,
} from "../components/estilos";
import { Mensagem } from "../components/Mensagem";
import { useDados } from "../hooks/useDados";
import {
	atualizarLeitor,
	criarLeitor,
	excluirLeitor,
	listarEmprestimosDoLeitor,
	listarLeitores,
} from "../services/leitores";
import { formatarData } from "../utils/datas";
import { STATUS_EMPRESTIMO } from "../utils/status";
import { validarLeitor } from "../validacao";

const LEITOR_VAZIO = { nome: "", email: "" };

function EmprestimosDoLeitor({ leitor, onFechar }) {
	const { dados, carregando, erro } = useDados(
		() => listarEmprestimosDoLeitor(leitor.id),
		leitor.id,
	);

	return (
		<section className={cartao} aria-label={`Empréstimos de ${leitor.nome}`}>
			<div className="mb-2 flex items-center justify-between">
				<h2 className="text-lg font-semibold">Empréstimos de {leitor.nome}</h2>
				<button type="button" className={botaoSecundario} onClick={onFechar}>
					Fechar
				</button>
			</div>
			{carregando && <Carregando />}
			<Mensagem texto={erro} />
			{!carregando && !erro && dados?.length === 0 && (
				<p className="text-sm text-neutral-600">
					Nenhum empréstimo registrado.
				</p>
			)}
			{!carregando && !erro && dados?.length > 0 && (
				<ul className="flex flex-col gap-1 text-sm">
					{dados.map((emprestimo) => (
						<li key={emprestimo.id}>
							{[
								`${emprestimo.livro.titulo}: ${STATUS_EMPRESTIMO[emprestimo.status]}`,
								`emprestado em ${formatarData(emprestimo.data_emprestimo)}`,
								`previsto para ${formatarData(emprestimo.data_prevista)}`,
								emprestimo.data_devolucao &&
									`devolvido em ${formatarData(emprestimo.data_devolucao)}`,
							]
								.filter(Boolean)
								.join(", ")}
						</li>
					))}
				</ul>
			)}
		</section>
	);
}

export function LeitoresPage() {
	const [busca, setBusca] = useState("");
	const [buscaAplicada, setBuscaAplicada] = useState("");
	const { dados, carregando, erro, recarregar } = useDados(
		() => listarLeitores({ busca: buscaAplicada }),
		buscaAplicada,
	);

	const [formulario, setFormulario] = useState(LEITOR_VAZIO);
	const [editandoId, setEditandoId] = useState(null);
	const [erros, setErros] = useState({});
	const [aviso, setAviso] = useState(null);
	const [enviando, setEnviando] = useState(false);
	const [excluindoId, setExcluindoId] = useState(null);
	const [vendoEmprestimos, setVendoEmprestimos] = useState(null);

	function alterar(campo) {
		return (evento) =>
			setFormulario((atual) => ({ ...atual, [campo]: evento.target.value }));
	}

	function limparFormulario() {
		setFormulario(LEITOR_VAZIO);
		setEditandoId(null);
		setErros({});
	}

	async function executar(acao, sucesso) {
		setEnviando(true);
		setAviso(null);
		try {
			await acao();
			setAviso({ tipo: "sucesso", texto: sucesso });
			await recarregar();
			return true;
		} catch (falha) {
			setAviso({ tipo: "erro", texto: falha.message });
			return false;
		} finally {
			setEnviando(false);
		}
	}

	async function salvar(evento) {
		evento.preventDefault();
		const encontrados = validarLeitor(formulario);
		setErros(encontrados);
		if (Object.keys(encontrados).length > 0) {
			return;
		}
		const dadosLeitor = {
			nome: formulario.nome.trim(),
			email: formulario.email.trim(),
		};
		const ok = editandoId
			? await executar(
					() => atualizarLeitor(editandoId, dadosLeitor),
					"Leitor atualizado.",
				)
			: await executar(() => criarLeitor(dadosLeitor), "Leitor cadastrado.");
		if (ok) {
			limparFormulario();
		}
	}

	async function confirmarExclusao(leitor) {
		await executar(
			() => excluirLeitor(leitor.id),
			`${leitor.nome} foi excluído.`,
		);
		setExcluindoId(null);
	}

	return (
		<section className="flex flex-col gap-4">
			<h1 className="text-2xl font-semibold text-inatel">Leitores</h1>

			<form
				onSubmit={salvar}
				noValidate
				className={`${cartao} grid gap-3 sm:grid-cols-2`}
				aria-label={editandoId ? "Editar leitor" : "Cadastrar leitor"}
			>
				<Campo
					rotulo="Nome"
					value={formulario.nome}
					onChange={alterar("nome")}
					erro={erros.nome}
				/>
				<Campo
					rotulo="E-mail"
					type="email"
					value={formulario.email}
					onChange={alterar("email")}
					erro={erros.email}
				/>
				<div className="flex gap-2 sm:col-span-2">
					<button type="submit" className={botaoPrimario} disabled={enviando}>
						{editandoId ? "Salvar alterações" : "Cadastrar leitor"}
					</button>
					{editandoId && (
						<button
							type="button"
							className={botaoSecundario}
							onClick={limparFormulario}
						>
							Cancelar edição
						</button>
					)}
				</div>
			</form>

			<Mensagem tipo={aviso?.tipo} texto={aviso?.texto} />

			<form
				className="flex flex-wrap items-end gap-3"
				onSubmit={(evento) => {
					evento.preventDefault();
					setBuscaAplicada(busca.trim());
				}}
			>
				<div className="w-64">
					<Campo
						rotulo="Buscar por nome ou e-mail"
						type="search"
						value={busca}
						onChange={(evento) => setBusca(evento.target.value)}
					/>
				</div>
				<button type="submit" className={botaoSecundario}>
					Buscar
				</button>
			</form>

			{vendoEmprestimos && (
				<EmprestimosDoLeitor
					leitor={vendoEmprestimos}
					onFechar={() => setVendoEmprestimos(null)}
				/>
			)}

			{carregando && <Carregando texto="Carregando leitores..." />}
			<Mensagem texto={erro} />
			{!carregando && !erro && dados?.length === 0 && (
				<p className="text-sm text-neutral-600">Nenhum leitor encontrado.</p>
			)}
			{!carregando && !erro && dados?.length > 0 && (
				<div className="overflow-x-auto">
					<table className={tabela}>
						<thead>
							<tr className="bg-neutral-100">
								<th className={celula}>Nome</th>
								<th className={celula}>E-mail</th>
								<th className={celula}>Empréstimos ativos</th>
								<th className={celula}>Situação</th>
								<th className={celula}>Ações</th>
							</tr>
						</thead>
						<tbody>
							{dados.map((leitor) => (
								<tr key={leitor.id}>
									<td className={celula}>{leitor.nome}</td>
									<td className={celula}>{leitor.email}</td>
									<td className={celula}>{leitor.emprestimos_ativos}</td>
									<td className={celula}>
										{leitor.possui_atraso ? (
											<span className="font-medium text-red-700">
												Com atraso
											</span>
										) : (
											"Em dia"
										)}
									</td>
									<td className={celula}>
										{excluindoId === leitor.id ? (
											<div className="flex flex-wrap gap-2">
												<span className="text-sm">Excluir este leitor?</span>
												<button
													type="button"
													className={botaoPerigo}
													disabled={enviando}
													onClick={() => confirmarExclusao(leitor)}
												>
													Confirmar exclusão
												</button>
												<button
													type="button"
													className={botaoSecundario}
													onClick={() => setExcluindoId(null)}
												>
													Manter
												</button>
											</div>
										) : (
											<div className="flex flex-wrap gap-2">
												<button
													type="button"
													className={botaoSecundario}
													aria-label={`Ver empréstimos de ${leitor.nome}`}
													onClick={() => setVendoEmprestimos(leitor)}
												>
													Ver empréstimos
												</button>
												<button
													type="button"
													className={botaoSecundario}
													aria-label={`Editar ${leitor.nome}`}
													onClick={() => {
														setEditandoId(leitor.id);
														setFormulario({
															nome: leitor.nome,
															email: leitor.email,
														});
														setErros({});
														setAviso(null);
													}}
												>
													Editar
												</button>
												<button
													type="button"
													className={botaoSecundario}
													aria-label={`Excluir ${leitor.nome}`}
													onClick={() => setExcluindoId(leitor.id)}
												>
													Excluir
												</button>
											</div>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
}
