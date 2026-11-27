import { useState } from "react";
import { Campo } from "../components/Campo";
import { Carregando } from "../components/Carregando";
import {
	botaoPrimario,
	botaoSecundario,
	cartao,
	celula,
	tabela,
} from "../components/estilos";
import { Mensagem } from "../components/Mensagem";
import { useDados } from "../hooks/useDados";
import {
	criarEmprestimo,
	devolverEmprestimo,
	listarEmprestimos,
	renovarEmprestimo,
} from "../services/emprestimos";
import { listarLeitores } from "../services/leitores";
import { listarLivros } from "../services/livros";
import { formatarData } from "../utils/datas";
import { STATUS_EMPRESTIMO } from "../utils/status";

// Mesmo limite padrão do backend (MAX_RENOVACOES); só decide quando mostrar o botão
export const MAX_RENOVACOES = 2;

export function EmprestimosPage() {
	const [status, setStatus] = useState("");
	const emprestimos = useDados(() => listarEmprestimos({ status }), status);
	const livros = useDados(() => listarLivros(), "livros");
	const leitores = useDados(() => listarLeitores(), "leitores");

	const [escolha, setEscolha] = useState({ livro_id: "", leitor_id: "" });
	const [erroEscolha, setErroEscolha] = useState({});
	const [aviso, setAviso] = useState(null);
	const [enviando, setEnviando] = useState(false);

	async function executar(acao, sucesso) {
		setEnviando(true);
		setAviso(null);
		try {
			await acao();
			setAviso({ tipo: "sucesso", texto: sucesso });
			// Um empréstimo muda a disponibilidade do livro e a situação do leitor
			await Promise.all([
				emprestimos.recarregar(),
				livros.recarregar(),
				leitores.recarregar(),
			]);
			return true;
		} catch (falha) {
			setAviso({ tipo: "erro", texto: falha.message });
			return false;
		} finally {
			setEnviando(false);
		}
	}

	async function emprestar(evento) {
		evento.preventDefault();
		const encontrados = {};
		if (!escolha.livro_id) encontrados.livro_id = "Escolha o livro.";
		if (!escolha.leitor_id) encontrados.leitor_id = "Escolha o leitor.";
		setErroEscolha(encontrados);
		if (Object.keys(encontrados).length > 0) {
			return;
		}
		const ok = await executar(
			() =>
				criarEmprestimo({
					livro_id: Number(escolha.livro_id),
					leitor_id: Number(escolha.leitor_id),
				}),
			"Empréstimo registrado.",
		);
		if (ok) {
			setEscolha({ livro_id: "", leitor_id: "" });
		}
	}

	const lista = emprestimos.dados;

	return (
		<section className="flex flex-col gap-4">
			<h1 className="text-2xl font-semibold text-inatel">Empréstimos</h1>

			<form
				onSubmit={emprestar}
				noValidate
				className={`${cartao} grid gap-3 sm:grid-cols-3 sm:items-end`}
				aria-label="Novo empréstimo"
			>
				<Campo
					rotulo="Livro"
					value={escolha.livro_id}
					onChange={(evento) =>
						setEscolha((atual) => ({ ...atual, livro_id: evento.target.value }))
					}
					erro={erroEscolha.livro_id}
				>
					<option value="">Selecione o livro</option>
					{livros.dados?.map((livro) => (
						<option key={livro.id} value={livro.id}>
							{`${livro.titulo} (${livro.disponiveis} ${
								livro.disponiveis === 1 ? "disponível" : "disponíveis"
							})`}
						</option>
					))}
				</Campo>
				<Campo
					rotulo="Leitor"
					value={escolha.leitor_id}
					onChange={(evento) =>
						setEscolha((atual) => ({
							...atual,
							leitor_id: evento.target.value,
						}))
					}
					erro={erroEscolha.leitor_id}
				>
					<option value="">Selecione o leitor</option>
					{leitores.dados?.map((leitor) => (
						<option key={leitor.id} value={leitor.id}>
							{leitor.nome}
						</option>
					))}
				</Campo>
				<div>
					<button type="submit" className={botaoPrimario} disabled={enviando}>
						Emprestar
					</button>
				</div>
			</form>

			<Mensagem tipo={aviso?.tipo} texto={aviso?.texto} />
			<Mensagem texto={livros.erro || leitores.erro} />

			<div className="w-56">
				<Campo
					rotulo="Filtrar por status"
					value={status}
					onChange={(evento) => setStatus(evento.target.value)}
				>
					<option value="">Todos</option>
					{Object.entries(STATUS_EMPRESTIMO).map(([valor, texto]) => (
						<option key={valor} value={valor}>
							{texto}
						</option>
					))}
				</Campo>
			</div>

			{emprestimos.carregando && (
				<Carregando texto="Carregando empréstimos..." />
			)}
			<Mensagem texto={emprestimos.erro} />
			{!emprestimos.carregando && !emprestimos.erro && lista?.length === 0 && (
				<p className="text-sm text-neutral-600">
					Nenhum empréstimo encontrado.
				</p>
			)}
			{!emprestimos.carregando && !emprestimos.erro && lista?.length > 0 && (
				<div className="overflow-x-auto">
					<table className={tabela}>
						<thead>
							<tr className="bg-neutral-100">
								<th className={celula}>Livro</th>
								<th className={celula}>Leitor</th>
								<th className={celula}>Emprestado em</th>
								<th className={celula}>Data prevista</th>
								<th className={celula}>Devolvido em</th>
								<th className={celula}>Renovações</th>
								<th className={celula}>Status</th>
								<th className={celula}>Dias de atraso</th>
								<th className={celula}>Ações</th>
							</tr>
						</thead>
						<tbody>
							{lista.map((emprestimo) => {
								const atrasado = emprestimo.status === "atrasado";
								const aberto = emprestimo.status !== "devolvido";
								// Atrasado não renova; a fila de reserva quem confere é a API
								const podeRenovar =
									emprestimo.status === "ativo" &&
									emprestimo.renovacoes < MAX_RENOVACOES;
								return (
									<tr
										key={emprestimo.id}
										className={atrasado ? "bg-red-50" : undefined}
									>
										<td className={celula}>{emprestimo.livro.titulo}</td>
										<td className={celula}>{emprestimo.leitor.nome}</td>
										<td className={celula}>
											{formatarData(emprestimo.data_emprestimo)}
										</td>
										<td className={celula}>
											{formatarData(emprestimo.data_prevista)}
										</td>
										<td className={celula}>
											{formatarData(emprestimo.data_devolucao)}
										</td>
										<td className={celula}>
											{emprestimo.renovacoes}/{MAX_RENOVACOES}
										</td>
										<td
											className={`${celula} ${atrasado ? "font-semibold text-red-700" : ""}`}
										>
											{STATUS_EMPRESTIMO[emprestimo.status]}
										</td>
										<td className={celula}>{emprestimo.dias_atraso}</td>
										<td className={celula}>
											<div className="flex flex-wrap gap-2">
												{aberto && (
													<button
														type="button"
														className={botaoPrimario}
														disabled={enviando}
														aria-label={`Devolver ${emprestimo.livro.titulo} de ${emprestimo.leitor.nome}`}
														onClick={() =>
															executar(
																() => devolverEmprestimo(emprestimo.id),
																"Devolução registrada.",
															)
														}
													>
														Devolver
													</button>
												)}
												{podeRenovar && (
													<button
														type="button"
														className={botaoSecundario}
														disabled={enviando}
														aria-label={`Renovar ${emprestimo.livro.titulo} de ${emprestimo.leitor.nome}`}
														onClick={() =>
															executar(
																() => renovarEmprestimo(emprestimo.id),
																"Empréstimo renovado.",
															)
														}
													>
														Renovar
													</button>
												)}
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
}
