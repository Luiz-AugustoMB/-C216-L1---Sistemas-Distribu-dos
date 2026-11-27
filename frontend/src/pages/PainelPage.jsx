import { Carregando } from "../components/Carregando";
import { botaoSecundario, cartao, celula, tabela } from "../components/estilos";
import { Mensagem } from "../components/Mensagem";
import { useDados } from "../hooks/useDados";
import { obterPainel } from "../services/painel";
import { formatarData } from "../utils/datas";

export function PainelPage() {
	const { dados, carregando, erro, recarregar } = useDados(
		obterPainel,
		"painel",
	);

	return (
		<section className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold text-inatel">Painel</h1>
				<button type="button" className={botaoSecundario} onClick={recarregar}>
					Atualizar
				</button>
			</div>

			{carregando && <Carregando texto="Carregando painel..." />}
			<Mensagem texto={erro} />

			{!carregando && !erro && dados && (
				<div className="grid gap-4 lg:grid-cols-2">
					<section className={cartao} aria-labelledby="titulo-atrasados">
						<h2 id="titulo-atrasados" className="mb-2 text-lg font-semibold">
							Empréstimos atrasados
						</h2>
						{dados.emprestimos_atrasados.length === 0 ? (
							<p className="text-sm text-neutral-600">
								Nenhum empréstimo atrasado.
							</p>
						) : (
							<table className={tabela}>
								<thead>
									<tr className="bg-neutral-100">
										<th className={celula}>Livro</th>
										<th className={celula}>Leitor</th>
										<th className={celula}>Data prevista</th>
										<th className={celula}>Dias de atraso</th>
									</tr>
								</thead>
								<tbody>
									{dados.emprestimos_atrasados.map((item) => (
										<tr key={item.emprestimo_id}>
											<td className={celula}>{item.livro.titulo}</td>
											<td className={celula}>{item.leitor.nome}</td>
											<td className={celula}>
												{formatarData(item.data_prevista)}
											</td>
											<td className={`${celula} font-semibold text-red-700`}>
												{item.dias_atraso}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</section>

					<section className={cartao} aria-labelledby="titulo-mais-emprestados">
						<h2
							id="titulo-mais-emprestados"
							className="mb-2 text-lg font-semibold"
						>
							Livros mais emprestados
						</h2>
						{dados.livros_mais_emprestados.length === 0 ? (
							<p className="text-sm text-neutral-600">
								Nenhum empréstimo registrado ainda.
							</p>
						) : (
							<ol className="flex flex-col gap-1 text-sm">
								{dados.livros_mais_emprestados.map((item) => (
									<li
										key={item.livro.id}
										className="flex justify-between gap-4"
									>
										<span>{item.livro.titulo}</span>
										<span className="font-semibold text-inatel">
											{item.total_emprestimos}{" "}
											{item.total_emprestimos === 1
												? "empréstimo"
												: "empréstimos"}
										</span>
									</li>
								))}
							</ol>
						)}
					</section>
				</div>
			)}
		</section>
	);
}
