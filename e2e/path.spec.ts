import { expect, Page, test } from '@playwright/test';

test('anonymous visitors stop at login, then two founders review a fixture finding', async ({ browser }) => {
  const adaContext = await browser.newContext();
  const graceContext = await browser.newContext();
  const ada = await adaContext.newPage();
  const grace = await graceContext.newPage();

  await ada.goto('/dashboard');
  await expect(ada).toHaveURL(/\/login/);
  await expect(ada.getByRole('link', { name: 'Continue with Google' })).toBeVisible();

  await signIn(ada, 'ada@example.com');
  await signIn(grace, 'grace@example.com');
  await submitQuestionnaire(ada, 'retail fixtures', 'fabrication', 'a small shop', 'a physical product');
  await submitQuestionnaire(grace, 'store displays', 'welding', 'steel stock', 'something we can make');

  await ada.goto('/alignments');
  await expect(ada.getByRole('checkbox')).toHaveCount(2);
  for (const box of await ada.getByRole('checkbox').all()) {
    await box.check();
  }
  await ada.getByRole('button', { name: 'Generate alignment' }).click();
  await expect(ada.getByRole('heading', { name: 'AI explanation' })).toBeVisible();
  await ada.getByRole('link', { name: 'Continue to a research direction' }).click();

  await ada.getByLabel('Title').fill('Shop fixtures');
  await ada.getByLabel('Description').fill('Physical fixtures for small retailers');
  await ada.getByRole('button', { name: 'Save direction' }).click();
  await ada.getByRole('link', { name: 'Start research' }).click();
  await ada.getByRole('button', { name: 'Start Census research' }).click();
  await expect(ada.getByText('County Business Patterns lists 100 establishments.')).toBeVisible();
  await expect(ada.getByRole('heading', { name: 'Factual summary' })).toBeVisible();
  await expect(ada.getByRole('heading', { name: 'AI interpretation' })).toBeVisible();
  await expect(ada.getByRole('heading', { name: 'Unknowns' })).toBeVisible();
  await expect(ada.getByText('cannot support willingness to pay')).toBeVisible();

  await ada.getByRole('link', { name: 'Open the dashboard review' }).click();
  await expect(ada.getByText('County Business Patterns lists 100 establishments.')).toBeVisible();
  await expect(ada.getByText('No research findings yet')).toHaveCount(0);

  await ada.goto('/opportunities');
  await expect(ada.getByRole('heading', { name: 'Factual summary' })).toBeVisible();
  await ada.getByLabel('Title').fill('Shop fixtures');
  await ada.getByLabel('Customer problem').fill('Retailers need a sturdier fixture');
  await ada.getByLabel('Target customer').fill('Independent hardware stores');
  await ada.getByRole('button', { name: 'Save opportunity' }).click();
  await ada.getByLabel('Description').fill('A steel shelf bracket');
  await ada.getByLabel('Target buyers').fill('Hardware stores');
  await ada.getByLabel('Differentiation').fill('Heavier gauge than the common import');
  await ada.getByLabel('Estimated costs').fill('Shop time and steel, not a verified unit cost');
  await ada.getByLabel('Feasibility').fill('A small shop can cut and weld it. This is a note, not a verified study.');
  await ada.getByRole('button', { name: 'Save product concept' }).click();
  await ada.getByLabel('Rationale').fill('Census does not prove customer pain.');
  await ada.getByRole('button', { name: 'ADVANCE' }).click();
  await expect(ada.getByText('Opportunity status: DRAFT')).toBeVisible();

  await adaContext.close();
  await graceContext.close();
});

async function signIn(page: Page, email: string): Promise<void> {
  await page.goto('/login');
  await page.request.get('/api/v1/session');
  const token = (await page.context().cookies()).find((cookie) => cookie.name === 'XSRF-TOKEN')?.value ?? '';
  const response = await page.request.post(`/e2e/login?email=${encodeURIComponent(email)}`, {
    headers: { 'X-XSRF-TOKEN': token },
  });
  expect(response.status()).toBe(204);
}

async function submitQuestionnaire(
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
