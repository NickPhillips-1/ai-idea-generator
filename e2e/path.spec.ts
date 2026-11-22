import { expect, test } from '@playwright/test';
import { alignTwoFounders, openFounder, saveDirection, signIn, startCensusResearch, submitQuestionnaire } from './support';

test('feature: login', async ({ browser }) => {
  const { page, close } = await openFounder(browser);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByLabel('Username')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();

  await signIn(page, 'ada@example.com');
  await page.goto('/dashboard');
  await expect(page.getByText('Signed in as ada@example.com.')).toBeVisible();
  await close();
});

test('feature: questionnaires', async ({ browser }) => {
  const { page, close } = await openFounder(browser);
  await signIn(page, 'ada@example.com');
  await submitQuestionnaire(page, 'retail fixtures', 'fabrication', 'a small shop', 'a physical product');
  await expect(page.getByRole('link', { name: 'Continue to alignment' })).toBeVisible();
  await close();
});

test('feature: alignments', async ({ browser }) => {
  const { ada, close } = await alignTwoFounders(browser);
  await expect(ada.getByText("This is the model's reading, not a verified fact.")).toBeVisible();
  await close();
});

test('feature: research', async ({ browser }) => {
  const { ada, close } = await alignTwoFounders(browser);
  await saveDirection(ada);
  await startCensusResearch(ada);
  await ada.getByRole('link', { name: 'Open the dashboard review' }).click();
  await expect(ada.getByText('County Business Patterns lists 100 establishments.')).toBeVisible();
  await expect(ada.getByText('No research findings yet')).toHaveCount(0);
  await close();
});

test('feature: opportunities', async ({ browser }) => {
  const { ada, close } = await alignTwoFounders(browser);
  await saveDirection(ada);
  await startCensusResearch(ada);
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
  await close();
});
