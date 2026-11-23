import { expect, test } from '@playwright/test';
import { openFounder, signIn } from './support';

test('feature: login', async ({ browser }) => {
  const nick = await openFounder(browser);
  await nick.page.goto('/dashboard');
  await expect(nick.page).toHaveURL(/\/login/);
  await expect(nick.page.getByLabel('Username')).toBeVisible();
  await expect(nick.page.getByLabel('Password')).toBeVisible();
  await nick.page.getByLabel('Username').fill('nick');
  await nick.page.getByLabel('Password').fill('password');
  await nick.page.getByRole('button', { name: 'Sign in' }).click();
  await expect(nick.page).toHaveURL(/\/dashboard/);
  await expect(nick.page.getByRole('heading', { name: 'What idea should we research?' })).toBeVisible();
  await nick.close();

  const { page, close } = await openFounder(browser);
  await signIn(page, 'ada@example.com');
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'What idea should we research?' })).toBeVisible();
  await close();
});
