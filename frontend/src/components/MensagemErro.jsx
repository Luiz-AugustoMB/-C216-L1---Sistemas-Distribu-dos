export function MensagemErro({ children, onTentarNovamente }) {
	return (
		<div
			role="alert"
			className="flex items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200"
		>
			<p className="min-w-0 wrap-break-word">{children}</p>
			{onTentarNovamente && (
				<button
					type="button"
					onClick={onTentarNovamente}
					className="shrink-0 rounded-lg px-3 py-1 font-medium text-red-800 ring-1 ring-red-300 hover:bg-red-100"
				>
					Tentar novamente
				</button>
			)}
		</div>
	);
}
