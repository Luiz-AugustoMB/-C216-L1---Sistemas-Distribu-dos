import { useCallback, useEffect, useRef, useState } from "react";

// Carrega dados de uma função de serviço e expõe carregando, erro e recarregar.
// "chave" muda quando os filtros mudam, para buscar de novo
export function useDados(buscar, chave) {
	const [dados, setDados] = useState(null);
	const [carregando, setCarregando] = useState(true);
	const [erro, setErro] = useState(null);
	// Se o filtro muda antes da resposta anterior chegar, só a busca mais recente vale:
	// uma resposta atrasada não pode sobrescrever a lista nova
	const ultimaBusca = useRef(0);

	// biome-ignore lint/correctness/useExhaustiveDependencies: a chave representa os filtros usados por buscar
	const recarregar = useCallback(async () => {
		const estaBusca = ++ultimaBusca.current;
		setCarregando(true);
		setErro(null);
		try {
			const resultado = await buscar();
			if (estaBusca === ultimaBusca.current) setDados(resultado);
		} catch (falha) {
			if (estaBusca === ultimaBusca.current) setErro(falha.message);
		} finally {
			if (estaBusca === ultimaBusca.current) setCarregando(false);
		}
	}, [chave]);

	useEffect(() => {
		recarregar();
	}, [recarregar]);

	return { dados, carregando, erro, recarregar };
}
