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
	atualizarLivro,
	criarLivro,
	excluirLivro,
	listarLivros,
} from "../services/livros";
import { validarLivro } from "../validacao";

const LIVRO_VAZIO = {
	titulo: "",
	autor: "",
	isbn: "",
	ano: "",
	exemplares: "1",
};

function paraFormulario(livro) {
	return {
		titulo: livro.titulo,
		autor: livro.autor,
		isbn: livro.isbn,
		ano: String(livro.ano),
		exemplares: String(livro.exemplares),
	};
}

export function LivrosPage() {
	const [filtros, setFiltros] = useState({ busca: "", disponivel: false });
	const [busca, setBusca] = useState("");
	const parametros = {
		busca: filtros.busca,
		disponivel: filtros.disponivel ? true : undefined,
	};
	const { dados, carregando, erro, recarregar } = useDados(
		() => listarLivros(parametros),
		JSON.stringify(parametros),
	);

	const [formulario, setFormulario] = useState(LIVRO_VAZIO);
	const [editandoId, setEditandoId] = useState(null);
	const [erros, setErros] = useState({});
	const [aviso, setAviso] = useState(null);
	const [enviando, setEnviando] = useState(false);
	const [excluindoId, setExcluindoId] = useState(null);

	function alterar(campo) {
		return (evento) =>
			setFormulario((atual) => ({ ...atual, [campo]: evento.target.value }));
	}

	function limparFormulario() {
		setFormulario(LIVRO_VAZIO);
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
		const encontrados = validarLivro(formulario);
		setErros(encontrados);
		if (Object.keys(encontrados).length > 0) {
			return;
		}
		const dadosLivro = {
			titulo: formulario.titulo.trim(),
			autor: formulario.autor.trim(),
			isbn: formulario.isbn.trim(),
			ano: Number(formulario.ano),
			exemplares: Number(formulario.exemplares),
		};
		const ok = editandoId
			? await executar(
					() => atualizarLivro(editandoId, dadosLivro),
					"Livro atualizado.",
				)
			: await executar(() => criarLivro(dadosLivro), "Livro cadastrado.");
		if (ok) {
			limparFormulario();
		}
	}

	async function confirmarExclusao(livro) {
		await executar(
			() => excluirLivro(livro.id),
			`"${livro.titulo}" foi excluído.`,
		);
		setExcluindoId(null);
	}

	return (
		<section className="flex flex-col gap-4">
			<h1 className="text-2xl font-semibold text-inatel">Livros</h1>

			<form
				onSubmit={salvar}
				noValidate
				className={`${cartao} grid gap-3 sm:grid-cols-2 lg:grid-cols-5`}
				aria-label={editandoId ? "Editar livro" : "Cadastrar livro"}
			>
				<Campo
					rotulo="Título"
					value={formulario.titulo}
					onChange={alterar("titulo")}
					erro={erros.titulo}
				/>
				<Campo
					rotulo="Autor"
					value={formulario.autor}
					onChange={alterar("autor")}
					erro={erros.autor}
				/>
				<Campo
					rotulo="ISBN"
					value={formulario.isbn}
					onChange={alterar("isbn")}
					erro={erros.isbn}
				/>
				<Campo
					rotulo="Ano"
					type="number"
					value={formulario.ano}
					onChange={alterar("ano")}
					erro={erros.ano}
				/>
				<Campo
					rotulo="Exemplares"
					type="number"
					min="1"
					value={formulario.exemplares}
					onChange={alterar("exemplares")}
					erro={erros.exemplares}
				/>
				<div className="flex gap-2 sm:col-span-2 lg:col-span-5">
					<button type="submit" className={botaoPrimario} disabled={enviando}>
						{editandoId ? "Salvar alterações" : "Cadastrar livro"}
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
					setFiltros((atual) => ({ ...atual, busca: busca.trim() }));
				}}
			>
				<div className="w-64">
					<Campo
						rotulo="Buscar por título ou autor"
						type="search"
						value={busca}
						onChange={(evento) => setBusca(evento.target.value)}
					/>
				</div>
				<button type="submit" className={botaoSecundario}>
					Buscar
				</button>
				<label className="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						checked={filtros.disponivel}
						onChange={(evento) =>
							setFiltros((atual) => ({
								...atual,
								disponivel: evento.target.checked,
							}))
						}
					/>
					Só com exemplar disponível
				</label>
			</form>

			{carregando && <Carregando texto="Carregando livros..." />}
			<Mensagem texto={erro} />
			{!carregando && !erro && dados?.length === 0 && (
				<p className="text-sm text-neutral-600">Nenhum livro encontrado.</p>
			)}
			{!carregando && !erro && dados?.length > 0 && (
				<div className="overflow-x-auto">
					<table className={tabela}>
						<thead>
							<tr className="bg-neutral-100">
								<th className={celula}>Título</th>
								<th className={celula}>Autor</th>
								<th className={celula}>Ano</th>
								<th className={celula}>ISBN</th>
								<th className={celula}>Disponíveis</th>
								<th className={celula}>Emprestados</th>
								<th className={celula}>Separados para reserva</th>
								<th className={celula}>Fila</th>
								<th className={celula}>Ações</th>
							</tr>
						</thead>
						<tbody>
							{dados.map((livro) => (
								<tr key={livro.id}>
									<td className={celula}>{livro.titulo}</td>
									<td className={celula}>{livro.autor}</td>
									<td className={celula}>{livro.ano}</td>
									<td className={celula}>{livro.isbn}</td>
									<td className={celula}>
										{livro.disponiveis}/{livro.exemplares}
									</td>
									<td className={celula}>{livro.emprestados}</td>
									<td className={celula}>{livro.separados_para_reserva}</td>
									<td className={celula}>{livro.tamanho_fila}</td>
									<td className={celula}>
										{excluindoId === livro.id ? (
											<div className="flex flex-wrap gap-2">
												<span className="text-sm">Excluir este livro?</span>
												<button
													type="button"
													className={botaoPerigo}
													disabled={enviando}
													onClick={() => confirmarExclusao(livro)}
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
													aria-label={`Editar ${livro.titulo}`}
													onClick={() => {
														setEditandoId(livro.id);
														setFormulario(paraFormulario(livro));
														setErros({});
														setAviso(null);
													}}
												>
													Editar
												</button>
												<button
													type="button"
													className={botaoSecundario}
													aria-label={`Excluir ${livro.titulo}`}
													onClick={() => setExcluindoId(livro.id)}
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
