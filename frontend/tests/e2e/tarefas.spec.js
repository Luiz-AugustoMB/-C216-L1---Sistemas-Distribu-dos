import { expect, test } from "@playwright/test";
import { API_URL } from "./ambiente.js";

test.beforeEach(async ({ page, request }) => {
	const resposta = await request.get(`${API_URL}/tarefas`);
	await expect(resposta).toBeOK();
	for (const { id } of await resposta.json()) {
		await expect(await request.delete(`${API_URL}/tarefas/${id}`)).toBeOK();
	}
	await page.goto("/");
	await expect(page.getByText(/pendente\(s\) de/)).toBeVisible();
});

async function adicionarTarefa(page, titulo, descricao) {
	await page.getByLabel("Título").fill(titulo);
	if (descricao) {
		await page.getByLabel("Descrição").fill(descricao);
	}
	await page.getByRole("button", { name: "Adicionar tarefa" }).click();
	await expect(
		page.getByRole("checkbox", { name: `Concluída: ${titulo}` }),
	).toBeVisible();
}

test("exibe a página inicial vazia", async ({ page }) => {
	await expect(page).toHaveTitle("Tarefas");
	await expect(page.getByRole("heading", { name: "Tarefas" })).toBeVisible();
	await expect(page.getByText("Nenhuma tarefa para exibir.")).toBeVisible();
});

test("fluxo completo: cadastrar, concluir, filtrar, editar e remover", async ({
	page,
	request,
}) => {
	const lista = page.getByRole("list", { name: "Lista de tarefas" });

	// Cadastro
	await adicionarTarefa(page, "Preparar relatório", "Prática 7");
	await adicionarTarefa(page, "Revisar PR");
	await expect(lista.getByRole("listitem")).toHaveCount(2);
	await expect(page.getByText("2 pendente(s) de 2 tarefa(s)")).toBeVisible();

	// Concluir
	await page.getByRole("checkbox", { name: "Concluída: Revisar PR" }).click();
	await expect(page.getByText("1 pendente(s) de 2 tarefa(s)")).toBeVisible();

	// Filtrar
	await page.getByRole("button", { name: "Concluídas" }).click();
	await expect(lista.getByRole("listitem")).toHaveCount(1);
	await expect(lista).toContainText("Revisar PR");
	await page.getByRole("button", { name: "Todas" }).click();

	// Editar
	await page.getByRole("button", { name: "Editar Preparar relatório" }).click();
	await expect(page.getByLabel("Título")).toHaveValue("Preparar relatório");
	await page.getByLabel("Título").fill("Entregar relatório");
	await page.getByRole("button", { name: "Salvar alterações" }).click();
	await expect(lista).toContainText("Entregar relatório");
	await expect(lista).not.toContainText("Preparar relatório");

	// Remover
	await page.getByRole("button", { name: "Remover Revisar PR" }).click();
	await expect(lista.getByRole("listitem")).toHaveCount(1);
	await expect(page.getByText("1 pendente(s) de 1 tarefa(s)")).toBeVisible();

	// O que a tela mostra é o que ficou gravado no banco
	const resposta = await request.get(`${API_URL}/tarefas`);
	expect(await resposta.json()).toMatchObject([
		{ titulo: "Entregar relatório", descricao: "Prática 7", concluida: false },
	]);
});

test("valida o título antes de chamar a API", async ({ page }) => {
	let chamouApi = false;
	page.on("request", (requisicao) => {
		if (requisicao.method() === "POST") {
			chamouApi = true;
		}
	});

	await page.getByRole("button", { name: "Adicionar tarefa" }).click();

	await expect(page.getByText("O título é obrigatório.")).toBeVisible();
	await expect(page.getByLabel("Título")).toHaveAttribute(
		"aria-invalid",
		"true",
	);
	await expect(page.getByText("Nenhuma tarefa para exibir.")).toBeVisible();
	expect(chamouApi).toBe(false);
});

test("no celular, editar um item no fim da lista leva até o formulário", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	for (let i = 1; i <= 8; i++) {
		await adicionarTarefa(page, `Tarefa ${i}`, "Descrição para ocupar espaço");
	}

	const editarUltima = page.getByRole("button", { name: "Editar Tarefa 8" });
	await editarUltima.scrollIntoViewIfNeeded();
	await expect(page.getByLabel("Título")).not.toBeInViewport();

	await editarUltima.click();

	await expect(page.getByLabel("Título")).toBeInViewport();
	await expect(page.getByLabel("Título")).toBeFocused();
	await expect(page.getByLabel("Título")).toHaveValue("Tarefa 8");
});

test("os dados persistem após recarregar a página", async ({ page }) => {
	await adicionarTarefa(page, "Gravada no banco");

	await page.reload();

	await expect(page.getByText("Gravada no banco")).toBeVisible();
	await expect(page.getByText("1 pendente(s) de 1 tarefa(s)")).toBeVisible();
});

test("mostra o 404 real da API quando a tarefa já foi removida", async ({
	page,
	request,
}) => {
	await adicionarTarefa(page, "Removida em outra aba");
	const resposta = await request.get(`${API_URL}/tarefas`);
	const [{ id }] = await resposta.json();
	await request.delete(`${API_URL}/tarefas/${id}`);

	await page
		.getByRole("button", { name: "Remover Removida em outra aba" })
		.click();

	await expect(page.getByRole("alert")).toHaveText("Tarefa não encontrada");
	await expect(page.getByText("Nenhuma tarefa para exibir.")).toBeVisible();
});

test("mostra o erro de conexão e recupera ao tentar novamente", async ({
	page,
}) => {
	await adicionarTarefa(page, "Já cadastrada");
	const semApi = `${API_URL}/**`;
	await page.route(semApi, (rota) => rota.abort("connectionrefused"));

	await page.reload();

	await expect(page.getByRole("alert")).toContainText(
		"Não foi possível conectar à API",
	);
	await expect(page.getByText("Já cadastrada")).not.toBeVisible();

	await page.unroute(semApi);
	await page.getByRole("button", { name: "Tentar novamente" }).click();

	await expect(page.getByText("Já cadastrada")).toBeVisible();
	await expect(page.getByRole("alert")).not.toBeVisible();
});

test("mantém o texto digitado se a API cair durante o cadastro", async ({
	page,
}) => {
	await page.route(`${API_URL}/**`, (rota) => rota.abort("connectionrefused"));

	await page.getByLabel("Título").fill("Não pode sumir");
	await page.getByRole("button", { name: "Adicionar tarefa" }).click();

	await expect(page.getByRole("alert")).toContainText(
		"Não foi possível conectar à API",
	);
	await expect(page.getByLabel("Título")).toHaveValue("Não pode sumir");
});
