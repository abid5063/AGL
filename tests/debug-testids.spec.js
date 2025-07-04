// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Debug TestID Issues', () => {
  test('should check for duplicate testIDs and page state', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check how many auth-email-input elements exist
    const emailInputs = await page.getByTestId('auth-email-input').all();
    console.log(`Found ${emailInputs.length} auth-email-input elements`);
    
    // Check all elements with data-testid attributes
    const allTestIds = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-testid]');
      const testIds = {};
      elements.forEach(el => {
        const testId = el.getAttribute('data-testid');
        if (testIds[testId]) {
          testIds[testId]++;
        } else {
          testIds[testId] = 1;
        }
      });
      return testIds;
    });
    
    console.log('All testIDs found:', allTestIds);
    
    // Look for duplicates
    const duplicates = Object.entries(allTestIds).filter(([testId, count]) => count > 1);
    if (duplicates.length > 0) {
      console.log('Duplicate testIDs found:', duplicates);
    }
    
    // Try to use the first auth-email-input if there are multiple
    if (emailInputs.length > 0) {
      await emailInputs[0].fill('test@example.com');
      console.log('Successfully filled the first email input');
    }
    
    // Check the page URL and console for any errors
    console.log('Current URL:', await page.url());
    
    // Check for any console errors
    page.on('console', msg => {
      console.log('Browser console:', msg.text());
    });
  });
});
