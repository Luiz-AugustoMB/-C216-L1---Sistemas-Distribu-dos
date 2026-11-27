export function Carregando({ texto = "Carregando..." }) {
	return (
		<p aria-busy="true" className="py-4 text-sm text-neutral-500">
			{texto}
		</p>
	);
}
