import { Cabecalho } from "./components/Cabecalho";
import { useRotaHash } from "./hooks/useRotaHash";
import { EmprestimosPage } from "./pages/EmprestimosPage";
import { LeitoresPage } from "./pages/LeitoresPage";
import { LivrosPage } from "./pages/LivrosPage";
import { PainelPage } from "./pages/PainelPage";
import { ReservasPage } from "./pages/ReservasPage";

const PAGINAS = {
	livros: LivrosPage,
	leitores: LeitoresPage,
	emprestimos: EmprestimosPage,
	reservas: ReservasPage,
	painel: PainelPage,
};

export function App() {
	const rota = useRotaHash();
	const Pagina = PAGINAS[rota];

	return (
		<>
			<Cabecalho rotaAtual={rota} />
			<main className="mx-auto max-w-6xl px-4 py-6">
				<Pagina />
			</main>
		</>
	);
}
