import { Browser, expect, Page } from '@playwright/test';

export async function signIn(page: Page, email: string): Promise<void> {
  await page.goto('/login');
  await page.request.get('/api/v1/session');
  const token = (await page.context().cookies()).find((cookie) => cookie.name === 'XSRF-TOKEN')?.value ?? '';
  const response = await page.request.post(`/e2e/login?email=${encodeURIComponent(email)}`, {
    headers: { 'X-XSRF-TOKEN': token },
  });
  expect(response.status()).toBe(204);
}

export async function submitQuestionnaire(
  page: Page,
  interests: string,
  skills: string,
  resources: string,
  goals: string,
): Promise<void> {
  await page.goto('/questionnaires');
  await page.getByLabel('Interests').fill(interests);
  await page.getByLabel('Skills').fill(skills);
  await page.getByLabel('Resources').fill(resources);
  await page.getByLabel('Goals').fill(goals);
  await page.getByRole('button', { name: 'Submit questionnaire' }).click();
  await expect(page.getByText(/Submitted questionnaire/)).toBeVisible();
}

export async function openFounder(browser: Browser): Promise<{ page: Page; close: () => Promise<void> }> {
  const context = await browser.newContext();
  const page = await context.newPage();
  return { page, close: () => context.close() };
}

export async function alignTwoFounders(browser: Browser): Promise<{ ada: Page; close: () => Promise<void> }> {
  const adaContext = await browser.newContext();
  const graceContext = await browser.newContext();
  const ada = await adaContext.newPage();
  const grace = await graceContext.newPage();
  await signIn(ada, 'ada@example.com');
  await signIn(grace, 'grace@example.com');
  await submitQuestionnaire(ada, 'retail fixtures', 'fabrication', 'a small shop', 'a physical product');
  await submitQuestionnaire(grace, 'store displays', 'welding', 'steel stock', 'something we can make');
  await ada.goto('/alignments');
  const boxes = ada.getByRole('checkbox');
  await expect.poll(async () => await boxes.count()).toBeGreaterThanOrEqual(2);
  for (const box of await boxes.all()) {
    await box.check();
  }
  await ada.getByRole('button', { name: 'Generate alignment' }).click();
  await expect(ada.getByRole('heading', { name: 'AI explanation' })).toBeVisible();
  return {
    ada,
    close: async () => {
      await adaContext.close();
      await graceContext.close();
    },
  };
}

export async function saveDirection(ada: Page): Promise<void> {
  await ada.getByRole('link', { name: 'Continue to a research direction' }).click();
  await ada.getByLabel('Title').fill('Shop fixtures');
  await ada.getByLabel('Description').fill('Physical fixtures for small retailers');
  await ada.getByRole('button', { name: 'Save direction' }).click();
  await expect(ada.getByRole('link', { name: 'Start research' })).toBeVisible();
}

export async function startCensusResearch(ada: Page): Promise<void> {
  await ada.getByRole('link', { name: 'Start research' }).click();
  await ada.getByRole('button', { name: 'Start Census research' }).click();
  await expect(ada.getByText('County Business Patterns lists 100 establishments.')).toBeVisible();
  await expect(ada.getByRole('heading', { name: 'Factual summary' })).toBeVisible();
  await expect(ada.getByRole('heading', { name: 'AI interpretation' })).toBeVisible();
  await expect(ada.getByRole('heading', { name: 'Unknowns' })).toBeVisible();
  await expect(ada.getByText('cannot support willingness to pay')).toBeVisible();
}
