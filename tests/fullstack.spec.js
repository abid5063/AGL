// @ts-check
import { test, expect } from '@playwright/test';

test.describe('AgroLink Full Stack E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    // Wait for the app to load completely
    await page.waitForLoadState('networkidle');
  });

  test('should load the authentication screen', async ({ page }) => {
    // Verify the login form elements are visible
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('submit-button')).toBeVisible();
    
    // Verify default state is login mode
    await expect(page.getByTestId('submit-button')).toContainText('Sign In');
  });

  test('should switch between login and register modes', async ({ page }) => {
    // Initially should be in login mode
    await expect(page.getByTestId('submit-button')).toContainText('Sign In');
    await expect(page.getByTestId('toggle-auth-mode-button')).toContainText('Need an account? Sign up');
    
    // Switch to register mode
    await page.getByTestId('toggle-auth-mode-button').click();
    
    // Should now be in register mode
    await expect(page.getByTestId('submit-button')).toContainText('Sign Up');
    await expect(page.getByTestId('toggle-auth-mode-button')).toContainText('Already have an account? Sign in');
    
    // Should show name field in register mode
    await expect(page.getByTestId('name-input')).toBeVisible();
  });

  test('should register a new user successfully', async ({ page }) => {
    // Switch to register mode
    await page.getByTestId('toggle-auth-mode-button').click();
    await expect(page.getByTestId('submit-button')).toContainText('Sign Up');
    
    // Fill in registration form
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    const testName = `TestUser${timestamp}`;
    
    await page.getByTestId('name-input').fill(testName);
    await page.getByTestId('email-input').fill(testEmail);
    await page.getByTestId('password-input').fill('password123');
    
    // Submit the form
    await page.getByTestId('submit-button').click();
    
    // Wait for registration to complete
    // Note: You'll need to add success indicators in your app
    // This is a placeholder - adjust based on your app's behavior
    await page.waitForTimeout(3000);
    
    // Check if redirected or success message appears
    // This depends on how your app handles successful registration
  });

  test('should show validation error for invalid login', async ({ page }) => {
    // Fill in invalid credentials
    await page.getByTestId('email-input').fill('invalid@example.com');
    await page.getByTestId('password-input').fill('wrongpassword');
    
    // Submit the form
    await page.getByTestId('submit-button').click();
    
    // Wait for API response
    await page.waitForTimeout(2000);
    
    // Check for error message (you might need to add error display in your app)
    // This is a placeholder - adjust based on how your app shows errors
  });

  test('should handle empty form submission', async ({ page }) => {
    // Try to submit without filling fields
    await page.getByTestId('submit-button').click();
    
    // Should show validation error
    // Note: This depends on how your app handles validation
    await page.waitForTimeout(1000);
  });
});
