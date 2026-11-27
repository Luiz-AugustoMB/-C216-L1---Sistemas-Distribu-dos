// A API manda datas como "AAAA-MM-DD". new Date("AAAA-MM-DD") lê esse texto como meia-noite
// em UTC, e no Brasil (UTC-3) isso vira o dia anterior. Por isso a data é montada a partir
// do próprio texto, sem passar por Date
export function formatarData(valor) {
	if (!valor) {
		return "-";
	}
	const [ano, mes, dia] = valor.slice(0, 10).split("-");
	return `${dia}/${mes}/${ano}`;
}

// Data e hora (criada_em, separada_em) vêm com fuso, então aqui o Date é seguro
export function formatarDataHora(valor) {
	if (!valor) {
		return "-";
	}
	return new Date(valor).toLocaleString("pt-BR", {
		timeZone: "America/Sao_Paulo",
		dateStyle: "short",
		timeStyle: "short",
	});
}
