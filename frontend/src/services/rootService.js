import { request } from "./api.js";

export function buscarMensagem() {
	return request("/");
}
