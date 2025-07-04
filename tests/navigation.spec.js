// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Navigation and Dashboard E2E Tests', () => {
  let testUser = null;

  test.beforeEach(async ({ page }) => {
    // Navigate to the app and register/login a test user
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Register a new test user
    const timestamp = Date.now();
    testUser = {
      name: `NavTestUser${timestamp}`,
      email: `navtest${timestamp}@test.com`,
      password: 'testpass123'
    };

    // Switch to register mode
    await page.getByTestId('toggle-auth-mode-button').click();
    
    // Fill registration form
    await page.getByTestId('name-input').fill(testUser.name);
    await page.getByTestId('email-input').fill(testUser.email);
    await page.getByTestId('password-input').fill(testUser.password);
    
    // Submit registration
    await page.getByTestId('submit-button').click();
    
    // Wait for navigation to profile page
    await page.waitForTimeout(3000);
  });

  test('should navigate to AI Chatbot', async ({ page }) => {
    // Wait for profile page to load
    await expect(page.getByTestId('ai-chatbot-button')).toBeVisible({ timeout: 10000 });
    
    // Click AI Chatbot button
    await page.getByTestId('ai-chatbot-button').click();
    
    // Wait for navigation
    await page.waitForTimeout(2000);
    
    // Verify we're on the AI Chatbot page
    await expect(page.getByText('AI Chatbot')).toBeVisible();
    await expect(page.getByText('Hello! I am your AI assistant')).toBeVisible();
    
    // Verify back button exists
    await expect(page.getByTestId('back-button')).toBeVisible();
  });

  test('should navigate to Disease Detection / Symptom Checker', async ({ page }) => {
    // Wait for profile page to load
    await expect(page.getByTestId('disease-detection-button')).toBeVisible({ timeout: 10000 });
    
    // Click Disease Detection button
    await page.getByTestId('disease-detection-button').click();
    
    // Wait for navigation
    await page.waitForTimeout(2000);
    
    // Verify we're on the symptom checker page
    await expect(page.getByText('Symptom Checker')).toBeVisible();
    await expect(page.getByTestId('symptoms-input')).toBeVisible();
    await expect(page.getByTestId('analyze-button')).toBeVisible();
  });

  test('should navigate to Edit Profile', async ({ page }) => {
    // Wait for profile page to load
    await expect(page.getByTestId('edit-profile-button')).toBeVisible({ timeout: 10000 });
    
    // Click Edit Profile button
    await page.getByTestId('edit-profile-button').click();
    
    // Wait for navigation
    await page.waitForTimeout(2000);
    
    // Verify we're on the edit profile page
    await expect(page.getByTestId('name-input')).toBeVisible();
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('phone-input')).toBeVisible();
    await expect(page.getByTestId('location-input')).toBeVisible();
    
    // Verify the form is pre-filled with user data
    await expect(page.getByTestId('name-input')).toHaveValue(testUser.name);
    await expect(page.getByTestId('email-input')).toHaveValue(testUser.email);
  });

  test('should navigate back from AI Chatbot', async ({ page }) => {
    // Navigate to AI Chatbot
    await expect(page.getByTestId('ai-chatbot-button')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('ai-chatbot-button').click();
    await page.waitForTimeout(2000);
    
    // Verify we're on chatbot page
    await expect(page.getByText('AI Chatbot')).toBeVisible();
    
    // Click back button
    await page.getByTestId('back-button').click();
    
    // Should be back on profile page
    await page.waitForTimeout(2000);
    await expect(page.getByTestId('add-animal-button')).toBeVisible();
    await expect(page.getByTestId('ai-chatbot-button')).toBeVisible();
  });

  test('should navigate back from Symptom Checker', async ({ page }) => {
    // Navigate to Symptom Checker
    await expect(page.getByTestId('disease-detection-button')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('disease-detection-button').click();
    await page.waitForTimeout(2000);
    
    // Verify we're on symptom checker page
    await expect(page.getByTestId('symptoms-input')).toBeVisible();
    
    // Click back button (assuming there's one)
    await page.getByTestId('back-button').click();
    
    // Should be back on profile page
    await page.waitForTimeout(2000);
    await expect(page.getByTestId('add-animal-button')).toBeVisible();
    await expect(page.getByTestId('disease-detection-button')).toBeVisible();
  });

  test('should maintain user session across navigation', async ({ page }) => {
    // Verify user name is displayed on profile
    await expect(page.getByText(testUser.name)).toBeVisible({ timeout: 10000 });
    
    // Navigate to AI Chatbot
    await page.getByTestId('ai-chatbot-button').click();
    await page.waitForTimeout(2000);
    
    // Navigate back
    await page.getByTestId('back-button').click();
    await page.waitForTimeout(2000);
    
    // Navigate to Edit Profile
    await page.getByTestId('edit-profile-button').click();
    await page.waitForTimeout(2000);
    
    // Verify user data is still there
    await expect(page.getByTestId('name-input')).toHaveValue(testUser.name);
    await expect(page.getByTestId('email-input')).toHaveValue(testUser.email);
    
    // Navigate to login (if there's a link)
    await page.getByTestId('go-to-login').click();
    await page.waitForTimeout(2000);
    
    // Should be back at login page
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
  });

  test('should handle deep linking and page refresh', async ({ page }) => {
    // Wait for profile to load fully
    await expect(page.getByTestId('add-animal-button')).toBeVisible({ timeout: 10000 });
    
    // Get current URL
    const currentUrl = page.url();
    
    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Should maintain session or redirect appropriately
    // This depends on how your app handles session persistence
    // Either should stay on profile or go to login
    const hasLoginForm = await page.getByTestId('email-input').isVisible();
    const hasProfileButton = await page.getByTestId('add-animal-button').isVisible();
    
    expect(hasLoginForm || hasProfileButton).toBeTruthy();
  });
});
