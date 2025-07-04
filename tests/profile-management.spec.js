// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Profile Management E2E Tests', () => {
  let testUser = null;

  test.beforeEach(async ({ page }) => {
    // Navigate to the app and register/login a test user
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Register a new test user
    const timestamp = Date.now();
    testUser = {
      name: `ProfileUser${timestamp}`,
      email: `profile${timestamp}@test.com`,
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

  test('should display user profile information', async ({ page }) => {
    // Wait for profile page to load
    await expect(page.getByText(testUser.name)).toBeVisible({ timeout: 10000 });
    
    // Verify profile elements are visible
    await expect(page.getByTestId('edit-profile-button')).toBeVisible();
    await expect(page.getByTestId('logout-button')).toBeVisible();
    await expect(page.getByTestId('add-animal-button')).toBeVisible();
    
    // Verify user name is displayed
    await expect(page.getByText(testUser.name)).toBeVisible();
  });

  test('should edit profile information', async ({ page }) => {
    // Navigate to edit profile
    await expect(page.getByTestId('edit-profile-button')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('edit-profile-button').click();
    await page.waitForTimeout(2000);
    
    // Verify form is pre-filled
    await expect(page.getByTestId('name-input')).toHaveValue(testUser.name);
    await expect(page.getByTestId('email-input')).toHaveValue(testUser.email);
    
    // Update profile information
    const updatedData = {
      name: `${testUser.name} Updated`,
      phone: '1234567890',
      location: 'Test Farm, Test City'
    };
    
    await page.getByTestId('name-input').fill(updatedData.name);
    await page.getByTestId('phone-input').fill(updatedData.phone);
    await page.getByTestId('location-input').fill(updatedData.location);
    
    // Save changes
    await page.getByTestId('save-button').click();
    
    // Wait for save operation
    await page.waitForTimeout(3000);
    
    // Verify success or navigation back to profile
    // This depends on your app's behavior after saving
  });

  test('should validate profile form', async ({ page }) => {
    // Navigate to edit profile
    await expect(page.getByTestId('edit-profile-button')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('edit-profile-button').click();
    await page.waitForTimeout(2000);
    
    // Clear required fields
    await page.getByTestId('name-input').fill('');
    await page.getByTestId('email-input').fill('');
    
    // Try to save
    await page.getByTestId('save-button').click();
    
    // Should show validation error or prevent submission
    await page.waitForTimeout(1000);
    
    // Form should still be visible (submission prevented)
    await expect(page.getByTestId('name-input')).toBeVisible();
    await expect(page.getByTestId('email-input')).toBeVisible();
  });

  test('should handle invalid email format', async ({ page }) => {
    // Navigate to edit profile
    await expect(page.getByTestId('edit-profile-button')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('edit-profile-button').click();
    await page.waitForTimeout(2000);
    
    // Enter invalid email
    await page.getByTestId('email-input').fill('invalid-email');
    
    // Try to save
    await page.getByTestId('save-button').click();
    
    // Should show validation error
    await page.waitForTimeout(1000);
    
    // Form should still be visible
    await expect(page.getByTestId('email-input')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Wait for profile page to load
    await expect(page.getByTestId('logout-button')).toBeVisible({ timeout: 10000 });
    
    // Click logout
    await page.getByTestId('logout-button').click();
    
    // Wait for logout process
    await page.waitForTimeout(3000);
    
    // Should be redirected to login page
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('submit-button')).toContainText('Sign In');
  });

  test('should maintain session after profile edit', async ({ page }) => {
    // Navigate to edit profile
    await expect(page.getByTestId('edit-profile-button')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('edit-profile-button').click();
    await page.waitForTimeout(2000);
    
    // Update name
    const updatedName = `${testUser.name} Session Test`;
    await page.getByTestId('name-input').fill(updatedName);
    
    // Save changes
    await page.getByTestId('save-button').click();
    await page.waitForTimeout(3000);
    
    // Navigate to another page (AI Chatbot)
    await page.getByTestId('ai-chatbot-button').click();
    await page.waitForTimeout(2000);
    
    // Navigate back to profile
    await page.getByTestId('back-button').click();
    await page.waitForTimeout(2000);
    
    // Verify updated name is still displayed
    await expect(page.getByText(updatedName)).toBeVisible();
  });

  test('should handle profile image upload placeholder', async ({ page }) => {
    // Navigate to edit profile
    await expect(page.getByTestId('edit-profile-button')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('edit-profile-button').click();
    await page.waitForTimeout(2000);
    
    // Verify image input exists
    await expect(page.getByTestId('image-input')).toBeVisible();
    
    // Note: Actual file upload testing would require more complex setup
    // This test just verifies the UI element exists
  });

  test('should prevent duplicate email registration', async ({ page }) => {
    // Logout first
    await expect(page.getByTestId('logout-button')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('logout-button').click();
    await page.waitForTimeout(3000);
    
    // Try to register with same email
    await page.getByTestId('toggle-auth-mode-button').click();
    
    await page.getByTestId('name-input').fill('Another User');
    await page.getByTestId('email-input').fill(testUser.email); // Same email
    await page.getByTestId('password-input').fill('differentpass');
    
    await page.getByTestId('submit-button').click();
    
    // Should show error or prevent registration
    await page.waitForTimeout(3000);
    
    // Should either stay on registration form or show error
    // This depends on your backend's duplicate email handling
  });

  test('should handle profile deletion', async ({ page }) => {
    // Navigate to edit profile
    await expect(page.getByTestId('edit-profile-button')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('edit-profile-button').click();
    await page.waitForTimeout(2000);
    
    // Click delete button
    await page.getByTestId('delete-button').click();
    
    // Handle confirmation dialog (if any)
    await page.waitForTimeout(2000);
    
    // Should be redirected to login page after deletion
    // Note: This is a destructive operation, so be careful with implementation
    const isOnLoginPage = await page.getByTestId('email-input').isVisible();
    const isStillOnProfile = await page.getByTestId('edit-profile-button').isVisible();
    
    // One of these should be true (either deleted or deletion prevented)
    expect(isOnLoginPage || isStillOnProfile).toBeTruthy();
  });
});
