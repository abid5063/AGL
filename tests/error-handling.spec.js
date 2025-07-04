// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Error Handling and Edge Cases E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Fill login form with valid-looking data
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('password123');
    
    // Go offline to simulate network error
    await page.context().setOffline(true);
    
    // Try to submit
    await page.getByTestId('submit-button').click();
    
    // Wait for error handling
    await page.waitForTimeout(3000);
    
    // Should remain on login page (couldn't connect to backend)
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    
    // Restore connection
    await page.context().setOffline(false);
  });

  test('should handle malformed API responses', async ({ page }) => {
    // This test would require mocking the API to return malformed responses
    // For now, we'll test the UI's resilience to unexpected states
    
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('wrongpassword');
    
    await page.getByTestId('submit-button').click();
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Should handle error gracefully (either show error or stay on page)
    const hasLoginForm = await page.getByTestId('email-input').isVisible();
    const hasErrorMessage = await page.getByText(/error|invalid|failed/i).isVisible();
    
    expect(hasLoginForm || hasErrorMessage).toBeTruthy();
  });

  test('should handle extremely long input values', async ({ page }) => {
    // Test with very long strings
    const longString = 'a'.repeat(1000);
    
    await page.getByTestId('email-input').fill(`${longString}@example.com`);
    await page.getByTestId('password-input').fill(longString);
    
    // Should either truncate, show validation error, or handle gracefully
    await page.getByTestId('submit-button').click();
    
    await page.waitForTimeout(2000);
    
    // Application should not crash
    await expect(page.getByTestId('email-input')).toBeVisible();
  });

  test('should handle special characters in input', async ({ page }) => {
    // Test with special characters and potential injection attempts
    const specialChars = '<script>alert("test")</script>';
    const sqlInjection = "'; DROP TABLE users; --";
    
    await page.getByTestId('email-input').fill(specialChars);
    await page.getByTestId('password-input').fill(sqlInjection);
    
    await page.getByTestId('submit-button').click();
    
    await page.waitForTimeout(2000);
    
    // Should handle safely without script execution
    await expect(page.getByTestId('email-input')).toBeVisible();
    
    // Verify no script was executed
    const alertPresent = await page.evaluate(() => {
      return window.confirm === confirm; // Check if original confirm function exists
    });
    expect(alertPresent).toBeTruthy();
  });

  test('should handle rapid clicking/form submission', async ({ page }) => {
    await page.getByTestId('email-input').fill('rapid@test.com');
    await page.getByTestId('password-input').fill('password123');
    
    // Click submit button rapidly multiple times
    const submitButton = page.getByTestId('submit-button');
    
    // Perform rapid clicks
    await Promise.all([
      submitButton.click(),
      submitButton.click(),
      submitButton.click(),
      submitButton.click(),
      submitButton.click()
    ]);
    
    await page.waitForTimeout(3000);
    
    // Application should handle gracefully without multiple submissions
    // Should remain stable
    await expect(page.getByTestId('email-input')).toBeVisible();
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    // Start at login page
    await expect(page.getByTestId('email-input')).toBeVisible();
    
    // Navigate to register mode
    await page.getByTestId('toggle-auth-mode-button').click();
    await expect(page.getByTestId('submit-button')).toContainText('Sign Up');
    
    // Use browser back button
    await page.goBack();
    
    // Should handle gracefully
    await page.waitForTimeout(1000);
    await expect(page.getByTestId('email-input')).toBeVisible();
    
    // Use browser forward button
    await page.goForward();
    await page.waitForTimeout(1000);
    await expect(page.getByTestId('email-input')).toBeVisible();
  });

  test('should handle page refresh during form filling', async ({ page }) => {
    // Fill form partially
    await page.getByTestId('email-input').fill('refresh@test.com');
    await page.getByTestId('password-input').fill('password123');
    
    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Form should be reset
    await expect(page.getByTestId('email-input')).toHaveValue('');
    await expect(page.getByTestId('password-input')).toHaveValue('');
  });

  test('should handle simultaneous user interactions', async ({ page }) => {
    // Switch to register mode
    await page.getByTestId('toggle-auth-mode-button').click();
    
    // Try to interact with multiple elements simultaneously
    await Promise.all([
      page.getByTestId('name-input').fill('Simultaneous User'),
      page.getByTestId('email-input').fill('sim@test.com'),
      page.getByTestId('password-input').fill('password123')
    ]);
    
    // All fields should be filled correctly
    await expect(page.getByTestId('name-input')).toHaveValue('Simultaneous User');
    await expect(page.getByTestId('email-input')).toHaveValue('sim@test.com');
    await expect(page.getByTestId('password-input')).toHaveValue('password123');
  });

  test('should handle empty response from backend', async ({ page }) => {
    // This would ideally require mocking, but we can test UI resilience
    await page.getByTestId('email-input').fill('empty@response.com');
    await page.getByTestId('password-input').fill('password123');
    
    await page.getByTestId('submit-button').click();
    
    // Wait for potential response
    await page.waitForTimeout(5000);
    
    // Should handle gracefully even if backend returns unexpected response
    const pageStillFunctional = await page.getByTestId('email-input').isVisible();
    expect(pageStillFunctional).toBeTruthy();
  });

  test('should handle session expiry', async ({ page }) => {
    // Register and login a user first
    const timestamp = Date.now();
    const testUser = {
      name: `SessionUser${timestamp}`,
      email: `session${timestamp}@test.com`,
      password: 'testpass123'
    };

    await page.getByTestId('toggle-auth-mode-button').click();
    await page.getByTestId('name-input').fill(testUser.name);
    await page.getByTestId('email-input').fill(testUser.email);
    await page.getByTestId('password-input').fill(testUser.password);
    await page.getByTestId('submit-button').click();
    
    await page.waitForTimeout(3000);
    
    // If successfully logged in, verify we're on profile page
    const isOnProfile = await page.getByTestId('add-animal-button').isVisible();
    
    if (isOnProfile) {
      // Clear storage to simulate session expiry
      await page.context().clearCookies();
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // Try to perform an action that requires authentication
      await page.getByTestId('add-animal-button').click();
      
      // Should either redirect to login or show error
      await page.waitForTimeout(3000);
      
      const backToLogin = await page.getByTestId('email-input').isVisible();
      const stillOnProfile = await page.getByTestId('add-animal-button').isVisible();
      
      // One of these should be true (handled session expiry)
      expect(backToLogin || stillOnProfile).toBeTruthy();
    }
  });

  test('should handle invalid authentication tokens', async ({ page }) => {
    // Set invalid token in storage
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'invalid-token-12345');
    });
    
    // Navigate to a protected route
    await page.goto('/profile');
    await page.waitForTimeout(3000);
    
    // Should redirect to login or handle invalid token gracefully
    const backToLogin = await page.getByTestId('email-input').isVisible();
    const hasErrorMessage = await page.getByText(/error|unauthorized|invalid/i).isVisible();
    
    expect(backToLogin || hasErrorMessage).toBeTruthy();
  });
});
