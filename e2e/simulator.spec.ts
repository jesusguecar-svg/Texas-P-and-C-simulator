import { expect, test } from "@playwright/test";

test("configura, contesta y finaliza una práctica", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Configura tu sesión" })).toBeVisible();
  await expect(page.getByText("300 preguntas")).toBeVisible();
  await page.screenshot({ path: "test-results/setup-desktop.png", fullPage: true });

  await page.getByRole("button", { name: "10", exact: true }).click();
  await page.locator("select").selectOption("inmediata");
  await page.getByRole("button", { name: /Iniciar sesión de 10 preguntas/ }).click();
  await expect(page.getByText(/Pregunta 1 de 10/)).toBeVisible();
  await page.locator(".option-main").first().click();
  await expect(page.getByText("Justificación", { exact: true })).toBeVisible();
  await page.locator(".strike-button").nth(1).click();
  await page.getByRole("button", { name: "Marcar" }).click();
  await page.getByRole("button", { name: /Usar tema oscuro/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({ path: "test-results/exam-desktop-dark.png", fullPage: true });

  await page.getByRole("button", { name: /Finalizar sesión/ }).click();
  await expect(page.getByRole("heading", { name: "¿Finalizar la sesión?" })).toBeVisible();
  await page.getByRole("button", { name: "Entregar respuestas" }).click();
  await expect(page.getByRole("heading", { name: "Resultados" })).toBeVisible();
  await page.getByRole("button", { name: /Revisar respuestas/ }).click();
  await expect(page.getByText("Explicación", { exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/results-desktop.png", fullPage: true });
});

test("la configuración y el examen funcionan en móvil", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole("heading", { name: "Configura tu sesión" })).toBeVisible();
  await page.screenshot({ path: "test-results/setup-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "10", exact: true }).click();
  await page.getByRole("button", { name: /Iniciar sesión de 10 preguntas/ }).click();
  await page.getByRole("button", { name: "Preguntas" }).click();
  await expect(page.getByText("Navegador", { exact: true })).toBeVisible();
  await expect(page.locator(".navigator")).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
  await page.screenshot({ path: "test-results/exam-mobile-navigator.png" });
});
