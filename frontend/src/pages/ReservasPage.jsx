import { useState } from "react";
import { Campo } from "../components/Campo";
import { Carregando } from "../components/Carregando";
import {
	botaoPerigo,
	botaoPrimario,
	cartao,
	celula,
	tabela,
} from "../components/estilos";
import { Mensagem } from "../components/Mensagem";
import { useDados } from "../hooks/useDados";
import { listarLeitores } from "../services/leitores";
import { listarLivros } from "../services/livros";
import {
	cancelarReserva,
	criarReserva,
	listarReservas,
} from "../services/reservas";
import { formatarData, formatarDataHora } from "../utils/datas";
import { STATUS_RESERVA } from "../utils/status";

const ABERTAS = ["na_fila", "aguardando_retirada"];

export function situacaoDaReserva(reserva) {
	if (reserva.status === "na_fila") {
		return reserva.posicao_na_fila
			? `Posição ${reserva.posicao_na_fila} na fila`
			: STATUS_RESERVA.na_fila;
	}
	if (reserva.status === "aguardando_retirada") {
		return `Separado para ${reserva.leitor.nome} até ${formatarData(reserva.expira_em)}`;
	}
	return STATUS_RESERVA[reserva.status];
}

export function ReservasPage() {
	const [filtros, setFiltros] = useState({ status: "", livro_id: "" });
	const reservas = useDados(
		() => listarReservas(filtros),
		JSON.stringify(filtros),
	);
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
			await Promise.all([reservas.recarregar(), livros.recarregar()]);
			return true;
		} catch (falha) {
			setAviso({ tipo: "erro", texto: falha.message });
			return false;
		} finally {
			setEnviando(false);
		}
	}

	async function reservar(evento) {
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
				criarReserva({
					livro_id: Number(escolha.livro_id),
					leitor_id: Number(escolha.leitor_id),
				}),
			"Leitor entrou na fila de reserva.",
		);
		if (ok) {
			setEscolha({ livro_id: "", leitor_id: "" });
		}
	}

	const lista = reservas.dados;

	return (
		<section className="flex flex-col gap-4">
			<h1 className="text-2xl font-semibold text-inatel">Reservas</h1>

			<form
				onSubmit={reservar}
				noValidate
				className={`${cartao} grid gap-3 sm:grid-cols-3 sm:items-end`}
				aria-label="Entrar na fila de reserva"
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
							{livro.titulo} (fila: {livro.tamanho_fila})
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
						Entrar na fila
					</button>
				</div>
			</form>

			<Mensagem tipo={aviso?.tipo} texto={aviso?.texto} />
			<Mensagem texto={livros.erro || leitores.erro} />

			<div className="flex flex-wrap gap-3">
				<div className="w-56">
					<Campo
						rotulo="Filtrar por status"
						value={filtros.status}
						onChange={(evento) =>
							setFiltros((atual) => ({ ...atual, status: evento.target.value }))
						}
					>
						<option value="">Todos</option>
						{Object.entries(STATUS_RESERVA).map(([valor, texto]) => (
							<option key={valor} value={valor}>
								{texto}
							</option>
						))}
					</Campo>
				</div>
				<div className="w-72">
					<Campo
						rotulo="Filtrar por livro"
						value={filtros.livro_id}
						onChange={(evento) =>
							setFiltros((atual) => ({
								...atual,
								livro_id: evento.target.value,
							}))
						}
					>
						<option value="">Todos os livros</option>
						{livros.dados?.map((livro) => (
							<option key={livro.id} value={livro.id}>
								{livro.titulo}
							</option>
						))}
					</Campo>
				</div>
			</div>

			{reservas.carregando && <Carregando texto="Carregando reservas..." />}
			<Mensagem texto={reservas.erro} />
			{!reservas.carregando && !reservas.erro && lista?.length === 0 && (
				<p className="text-sm text-neutral-600">Nenhuma reserva encontrada.</p>
			)}
			{!reservas.carregando && !reservas.erro && lista?.length > 0 && (
				<div className="overflow-x-auto">
					<table className={tabela}>
						<thead>
							<tr className="bg-neutral-100">
								<th className={celula}>Livro</th>
								<th className={celula}>Leitor</th>
								<th className={celula}>Status</th>
								<th className={celula}>Situação</th>
								<th className={celula}>Pedida em</th>
								<th className={celula}>Ações</th>
							</tr>
						</thead>
						<tbody>
							{lista.map((reserva) => (
								<tr key={reserva.id}>
									<td className={celula}>{reserva.livro.titulo}</td>
									<td className={celula}>{reserva.leitor.nome}</td>
									<td className={celula}>{STATUS_RESERVA[reserva.status]}</td>
									<td
										className={`${celula} ${
											reserva.status === "aguardando_retirada"
												? "font-semibold text-inatel"
												: ""
										}`}
									>
										{situacaoDaReserva(reserva)}
									</td>
									<td className={celula}>
										{formatarDataHora(reserva.criada_em)}
									</td>
									<td className={celula}>
										{ABERTAS.includes(reserva.status) && (
											<button
												type="button"
												className={botaoPerigo}
												disabled={enviando}
												aria-label={`Cancelar reserva de ${reserva.leitor.nome} para ${reserva.livro.titulo}`}
												onClick={() =>
													executar(
														() => cancelarReserva(reserva.id),
														"Reserva cancelada.",
													)
												}
											>
												Cancelar reserva
											</button>
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
