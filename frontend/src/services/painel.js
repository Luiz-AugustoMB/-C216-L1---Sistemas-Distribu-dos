import { request } from "./api";

export function obterPainel() {
	return request("/painel");
}
