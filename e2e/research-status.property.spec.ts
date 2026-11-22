import { expect, test, type Page } from '@playwright/test';
import { alignTwoFounders, saveDirection } from './support';

const STATUSES = ['PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED'] as const;
const JOB_ID = '00000000-0000-0000-0000-0000000000aa';

test('property: research statuses', async ({ browser }) => {
  test.setTimeout(120_000);
  const { ada, close } = await alignTwoFounders(browser);
  await saveDirection(ada);

  for (const status of STATUSES) {
    await showStatus(ada, status);
  }
  await close();
});

async function showStatus(page: Page, status: (typeof STATUSES)[number]): Promise<void> {
  let jobGets = 0;
  await page.unroute('**/api/v1/directions/*/research');
  await page.unroute('**/api/v1/research-jobs/**');
  await page.unroute('**/api/v1/directions/*/findings');

  await page.route('**/api/v1/directions/*/research', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({ jobId: JOB_ID, status: 'PENDING' }),
    });
  });
  await page.route('**/api/v1/research-jobs/**', async (route) => {
    jobGets += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: JOB_ID, status }),
    });
  });
  await page.route('**/api/v1/directions/*/findings', async (route) => {
    const items =
      status === 'SUCCEEDED'
        ? [
            {
              id: '00000000-0000-0000-0000-0000000000bb',
              factualSummary: 'County Business Patterns lists 100 establishments.',
              supportingEvidence: 'ESTAB 100',
              aiInterpretation: 'This reading is not proof that a customer has the problem.',
              unknowns: 'County Business Patterns does not show willingness to pay.',
              verificationStatus: 'UNREVIEWED',
              originalReference: 'https://api.census.gov/data/2022/cbp',
              retrievedAt: '2026-11-22T00:00:00Z',
            },
          ]
        : [];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items }),
    });
  });

  await page.evaluate(() => sessionStorage.removeItem('founderslab.jobId'));
  await page.goto('/research');
  await page.getByRole('button', { name: 'Start Census research' }).click();
  await expect(page.getByText(`Job status: ${status}`)).toBeVisible();

  if (status === 'SUCCEEDED') {
    await expect(page.getByRole('heading', { name: 'Factual summary' })).toBeVisible();
    await expect(page.getByText('County Business Patterns lists 100 establishments.')).toBeVisible();
  } else {
    await expect(page.getByRole('heading', { name: 'Factual summary' })).toHaveCount(0);
  }

  if (status === 'PENDING' || status === 'RUNNING') {
    const seen = jobGets;
    await expect.poll(() => jobGets, { timeout: 7_000 }).toBeGreaterThan(seen);
  } else {
    const settled = jobGets;
    await page.waitForTimeout(2_500);
    expect(jobGets).toBe(settled);
  }
}
