import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const SAMPLE_ENVELOPE = {
  results: [
    {
      line_number: 1,
      input: '2.12,3.00',
      status: 'ok',
      change: '3 quarters,1 dime,3 pennies',
      error: null,
    },
    { line_number: 2, input: '1.97,2.00', status: 'ok', change: '3 pennies', error: null },
    {
      line_number: 3,
      input: '3.33,5.00',
      status: 'ok',
      change: '1 dollar,1 quarter,6 nickels,12 pennies',
      error: null,
    },
  ],
}

async function mockChange(page: Page, envelope: unknown) {
  await page.route('**/change', (route) => route.fulfill({ json: envelope }))
}

test('flat file workflow: preloaded sample submits and renders per-line change', async ({
  page,
}) => {
  await mockChange(page, SAMPLE_ENVELOPE)
  await page.goto('/')

  await page.getByRole('tab', { name: 'Flat File' }).click()
  await expect(page.getByLabel('Flat file lines')).toHaveValue(/2\.12,3\.00/)

  await page.getByRole('button', { name: 'Calculate Change' }).click()

  await expect(page.getByText('3 quarters,1 dime,3 pennies')).toBeVisible()
  await expect(page.getByText('3 pennies', { exact: true })).toBeVisible()
  await expect(page.getByLabel('3 × 25¢')).toBeVisible()
  await expect(page.getByLabel('12 × 1¢')).toBeVisible()
})

test('cashier workflow: tap payment, calculate, read change', async ({ page }) => {
  await mockChange(page, {
    results: [
      {
        line_number: 1,
        input: '2.12,3.00',
        status: 'ok',
        change: '3 quarters,1 dime,3 pennies',
        error: null,
      },
    ],
  })
  await page.goto('/')

  await page.getByLabel('Amount owed').fill('2.12')
  const dollar = page.getByRole('button', { name: 'Add $1', exact: true })
  await dollar.click()
  await dollar.click()
  await dollar.click()

  await expect(page.getByText('$3.00')).toBeVisible()
  await page.getByRole('button', { name: 'Calculate Change' }).click()

  await expect(page.getByText('3 quarters,1 dime,3 pennies')).toBeVisible()
})

test('per-line errors render as Line N rows in the browser', async ({ page }) => {
  await mockChange(page, {
    results: [
      { line_number: 1, input: '1.97,2.00', status: 'ok', change: '3 pennies', error: null },
      {
        line_number: 2,
        input: 'bogus,x',
        status: 'error',
        change: null,
        error: "invalid amount: 'bogus'",
      },
    ],
  })
  await page.goto('/')

  await page.getByRole('tab', { name: 'Flat File' }).click()
  await page.getByLabel('Flat file lines').fill('1.97,2.00\nbogus,x')
  await page.getByRole('button', { name: 'Calculate Change' }).click()

  await expect(page.getByText("Line 2: invalid amount: 'bogus'")).toBeVisible()
  await expect(page.getByText('3 pennies', { exact: true })).toBeVisible()
})
