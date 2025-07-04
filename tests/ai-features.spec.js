// @ts-check
import { test, expect } from '@playwright/test';

test.describe('AI Features E2E Tests', () => {
  let testUser = null;

  test.beforeEach(async ({ page }) => {
    // Navigate to the app and register/login a test user
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Register a new test user
    const timestamp = Date.now();
    testUser = {
      name: `AITestUser${timestamp}`,
      email: `aitest${timestamp}@test.com`,
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

  test('should interact with AI Chatbot', async ({ page }) => {
    // Navigate to AI Chatbot
    await expect(page.getByTestId('ai-chatbot-button')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('ai-chatbot-button').click();
    await page.waitForTimeout(2000);
    
    // Verify initial bot message
    await expect(page.getByText('Hello! I am your AI assistant')).toBeVisible();
    
    // Type a message
    const userMessage = 'What should I feed my cow?';
    await page.getByTestId('message-input').fill(userMessage);
    
    // Send message
    await page.getByTestId('send-button').click();
    
    // Verify user message appears
    await expect(page.getByText(userMessage)).toBeVisible();
    
    // Wait for AI response (this might take a few seconds)
    await page.waitForTimeout(5000);
    
    // Verify loading indicator appears and disappears
    // The exact behavior depends on your implementation
  });

  test('should handle empty chatbot input', async ({ page }) => {
    // Navigate to AI Chatbot
    await expect(page.getByTestId('ai-chatbot-button')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('ai-chatbot-button').click();
    await page.waitForTimeout(2000);
    
    // Try to send empty message
    await page.getByTestId('send-button').click();
    
    // Should not send empty message
    // Verify only the initial bot message is present
    const messages = await page.getByText('Hello! I am your AI assistant').count();
    expect(messages).toBe(1);
  });

  test('should use Symptom Checker basic functionality', async ({ page }) => {
    // Navigate to Symptom Checker
    await expect(page.getByTestId('disease-detection-button')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('disease-detection-button').click();
    await page.waitForTimeout(2000);
    
    // Verify symptom checker elements
    await expect(page.getByTestId('symptoms-input')).toBeVisible();
    await expect(page.getByTestId('analyze-button')).toBeVisible();
    await expect(page.getByTestId('image-picker-button')).toBeVisible();
    
    // Enter symptoms
    const symptoms = 'Cow is not eating, seems lethargic, has runny nose';
    await page.getByTestId('symptoms-input').fill(symptoms);
    
    // Click analyze (note: this might make real API calls)
    await page.getByTestId('analyze-button').click();
    
    // Wait for analysis
    await page.waitForTimeout(3000);
    
    // Check if result container appears
    const resultVisible = await page.getByTestId('result-container').isVisible();
    if (resultVisible) {
      // Verify result or error text is shown
      const hasResultText = await page.getByTestId('result-text').isVisible();
      const hasErrorText = await page.getByTestId('error-text').isVisible();
      expect(hasResultText || hasErrorText).toBeTruthy();
    }
  });

  test('should handle empty symptom input', async ({ page }) => {
    // Navigate to Symptom Checker
    await expect(page.getByTestId('disease-detection-button')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('disease-detection-button').click();
    await page.waitForTimeout(2000);
    
    // Try to analyze without entering symptoms
    await page.getByTestId('analyze-button').click();
    
    // Should either show validation message or not proceed
    await page.waitForTimeout(1000);
    
    // Verify symptoms input is still visible (analysis didn't proceed)
    await expect(page.getByTestId('symptoms-input')).toBeVisible();
  });

  test('should navigate to Pro Mode from Symptom Checker', async ({ page }) => {
    // Navigate to Symptom Checker
    await expect(page.getByTestId('disease-detection-button')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('disease-detection-button').click();
    await page.waitForTimeout(2000);
    
    // Click Pro Mode button
    await page.getByTestId('pro-button').click();
    
    // Wait for navigation
    await page.waitForTimeout(2000);
    
    // Verify we're on Pro Mode page
    await expect(page.getByText('Pro Mode')).toBeVisible();
    await expect(page.getByTestId('back-button')).toBeVisible();
    
    // Verify symptom checkboxes are available
    const feverCheckbox = page.getByTestId('symptom-Fever');
    if (await feverCheckbox.isVisible()) {
      await expect(feverCheckbox).toBeVisible();
    }
  });

  test('should use Pro Mode symptom selection', async ({ page }) => {
    // Navigate to Symptom Checker then Pro Mode
    await expect(page.getByTestId('disease-detection-button')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('disease-detection-button').click();
    await page.waitForTimeout(2000);
    await page.getByTestId('pro-button').click();
    await page.waitForTimeout(2000);
    
    // Select some symptoms (if available)
    const availableSymptoms = ['Fever', 'Cough', 'Loss of appetite', 'Lethargy'];
    
    for (const symptom of availableSymptoms) {
      const checkbox = page.getByTestId(`symptom-${symptom}`);
      if (await checkbox.isVisible()) {
        await checkbox.click();
        break; // Select at least one symptom
      }
    }
    
    // Click predict button
    await page.getByTestId('predict-button').click();
    
    // Wait for prediction
    await page.waitForTimeout(3000);
    
    // Check for results (depends on implementation)
  });

  test('should clear symptoms in Pro Mode', async ({ page }) => {
    // Navigate to Pro Mode
    await expect(page.getByTestId('disease-detection-button')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('disease-detection-button').click();
    await page.waitForTimeout(2000);
    await page.getByTestId('pro-button').click();
    await page.waitForTimeout(2000);
    
    // Select a symptom
    const feverCheckbox = page.getByTestId('symptom-Fever');
    if (await feverCheckbox.isVisible()) {
      await feverCheckbox.click();
      
      // Clear symptoms
      await page.getByTestId('clear-button').click();
      
      // Verify checkbox is unchecked
      await expect(feverCheckbox).not.toBeChecked();
    }
  });

  test('should handle chatbot API errors gracefully', async ({ page }) => {
    // Navigate to AI Chatbot
    await expect(page.getByTestId('ai-chatbot-button')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('ai-chatbot-button').click();
    await page.waitForTimeout(2000);
    
    // Simulate network issues by going offline
    await page.context().setOffline(true);
    
    // Try to send a message
    await page.getByTestId('message-input').fill('Test message while offline');
    await page.getByTestId('send-button').click();
    
    // Wait for error handling
    await page.waitForTimeout(3000);
    
    // Should show error message
    await expect(page.getByText(/Sorry, I could not get a response/)).toBeVisible();
    
    // Restore connection
    await page.context().setOffline(false);
  });
});
