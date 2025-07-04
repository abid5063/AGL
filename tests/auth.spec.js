// @ts-check
import { test, expect } from '@playwright/test';

test.describe('AgroLink Mobile App', () => {
  test('should load the authentication screen', async ({ page }) => {
    await page.goto('/');
    
    // Verify the login form elements are visible
    await expect(page.getByTestId('auth-email-input')).toBeVisible();
    await expect(page.getByTestId('auth-password-input')).toBeVisible();
    await expect(page.getByTestId('auth-submit-button')).toBeVisible();
    
    // Verify default state is login mode
    await expect(page.getByTestId('auth-submit-button')).toContainText('Sign In');
  });

  test('should switch between login and register modes', async ({ page }) => {
    await page.goto('/');
    
    // Initially should be in login mode
    await expect(page.getByTestId('auth-submit-button')).toContainText('Sign In');
    await expect(page.getByTestId('auth-toggle-mode-button')).toContainText('Need an account? Sign up');
    
    // Switch to register mode
    await page.getByTestId('auth-toggle-mode-button').click();
    
    // Should now be in register mode
    await expect(page.getByTestId('auth-submit-button')).toContainText('Sign Up');
    await expect(page.getByTestId('auth-toggle-mode-button')).toContainText('Already have an account? Sign in');
  });

  test('should show validation error for empty fields', async ({ page }) => {
    await page.goto('/');
    
    // Try to submit without filling fields
    await page.getByTestId('auth-submit-button').click();
    
    // Should show an alert or error message
    // Note: We'll need to handle React Native Alert differently in web
    // This test might need adjustment based on how alerts appear in web view
  });

  test('should allow user to fill login form', async ({ page }) => {
    await page.goto('/');
    
    // Fill in the login form
    await page.getByTestId('auth-email-input').fill('test@example.com');
    await page.getByTestId('auth-password-input').fill('password123');
    
    // Verify the form is filled
    await expect(page.getByTestId('email-input')).toHaveValue('test@example.com');
    await expect(page.getByTestId('password-input')).toHaveValue('password123');
  });
});
