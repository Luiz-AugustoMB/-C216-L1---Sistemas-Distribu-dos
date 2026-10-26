import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
	await page.goto("/");
});

async function adicionarTarefa(page, titulo, descricao) {
	await page.getByLabel("Título").fill(titulo);
	if (descricao) {
		await page.getByLabel("Descrição").fill(descricao);
	}
	await page.getByRole("button", { name: "Adicionar tarefa" }).click();
}

test("exibe a página inicial vazia", async ({ page }) => {
	await expect(page).toHaveTitle("Tarefas");
	await expect(page.getByRole("heading", { name: "Tarefas" })).toBeVisible();
	await expect(page.getByText("Nenhuma tarefa para exibir.")).toBeVisible();
});

test("fluxo completo: cadastrar, concluir, filtrar, editar e remover", async ({
	page,
}) => {
	const lista = page.getByRole("list", { name: "Lista de tarefas" });

	// Cadastro
	await adicionarTarefa(page, "Preparar relatório", "Prática 6");
	await adicionarTarefa(page, "Revisar PR");
	await expect(lista.getByRole("listitem")).toHaveCount(2);
	await expect(page.getByText("2 pendente(s) de 2 tarefa(s)")).toBeVisible();

	// Concluir
	await page.getByRole("checkbox", { name: "Concluída: Revisar PR" }).check();
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
});

test("valida o título antes de cadastrar", async ({ page }) => {
	await page.getByRole("button", { name: "Adicionar tarefa" }).click();

	await expect(page.getByText("O título é obrigatório.")).toBeVisible();
	await expect(page.getByLabel("Título")).toHaveAttribute(
		"aria-invalid",
		"true",
	);
	await expect(page.getByText("Nenhuma tarefa para exibir.")).toBeVisible();
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

test("os dados não persistem após recarregar a página", async ({ page }) => {
	await adicionarTarefa(page, "Só em memória");
	await expect(page.getByText("Só em memória")).toBeVisible();

	await page.reload();

	await expect(page.getByText("Nenhuma tarefa para exibir.")).toBeVisible();
});
