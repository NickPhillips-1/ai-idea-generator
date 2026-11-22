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

export async function openFounder(browser: Browser): Promise<{ page: Page; close: () => Promise<void> }> {
  const context = await browser.newContext();
  const page = await context.newPage();
  return { page, close: () => context.close() };
}
