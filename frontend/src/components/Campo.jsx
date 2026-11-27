import { useId } from "react";
import { entrada } from "./estilos";

// Rótulo sempre ligado ao campo pelo id, e o erro ligado por aria-describedby: é assim
// que os testes e o leitor de tela encontram cada campo
export function Campo({ rotulo, erro, children, ...props }) {
	const id = useId();
	const idErro = `${id}-erro`;
	const atributos = {
		id,
		className: entrada,
		"aria-invalid": erro ? true : undefined,
		"aria-describedby": erro ? idErro : undefined,
		...props,
	};

	return (
		<div className="flex flex-col gap-1">
			<label htmlFor={id} className="text-sm font-medium text-neutral-700">
				{rotulo}
			</label>
			{children ? (
				<select {...atributos}>{children}</select>
			) : (
				<input {...atributos} />
			)}
			{erro && (
				<span id={idErro} className="text-xs text-red-700">
					{erro}
				</span>
			)}
		</div>
	);
}
