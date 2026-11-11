// Portas próprias: o E2E sobe uma cópia isolada da stack e pode rodar com os
// containers de desenvolvimento no ar, sem apagar os dados deles
const API_PORT = "18000";
const DB_PORT = "15432";
const FRONTEND_PORT = "15173";

export const API_URL = `http://localhost:${API_PORT}`;
export const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}`;

export const VARIAVEIS_COMPOSE = {
	API_PORT,
	DB_PORT,
	FRONTEND_PORT,
	VITE_API_URL: API_URL,
	CORS_ORIGINS: FRONTEND_URL,
};
