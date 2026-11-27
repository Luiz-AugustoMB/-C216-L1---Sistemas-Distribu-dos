import { ROTAS } from "../hooks/useRotaHash";

export function Cabecalho({ rotaAtual }) {
	return (
		<header className="bg-inatel text-white">
			<div className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-4 py-3">
				<a href="#/livros" className="text-xl font-semibold">
					Acervo
				</a>
				<nav aria-label="Principal">
					<ul className="flex flex-wrap gap-1">
						{ROTAS.map((rota) => (
							<li key={rota.id}>
								<a
									href={`#/${rota.id}`}
									aria-current={rota.id === rotaAtual ? "page" : undefined}
									className={`rounded px-3 py-1.5 text-sm hover:bg-inatel-escuro ${
										rota.id === rotaAtual
											? "bg-inatel-escuro font-semibold"
											: ""
									}`}
								>
									{rota.titulo}
								</a>
							</li>
						))}
					</ul>
				</nav>
			</div>
		</header>
	);
}
