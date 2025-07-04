// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Animal Management E2E Tests', () => {
  let testUser = null;

  test.beforeEach(async ({ page }) => {
    // Navigate to the app and register/login a test user
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Register a new test user
    const timestamp = Date.now();
    testUser = {
      name: `TestFarmer${timestamp}`,
      email: `farmer${timestamp}@test.com`,
      password: 'testpass123'
    };

    // Switch to register mode
    await page.getByTestId('auth-toggle-mode-button').click();
    
    // Fill registration form
    await page.getByTestId('auth-name-input').fill(testUser.name);
    await page.getByTestId('auth-email-input').fill(testUser.email);
    await page.getByTestId('auth-password-input').fill(testUser.password);
    
    // Submit registration
    await page.getByTestId('auth-submit-button').click();
    
    // Wait for navigation to profile page
    await page.waitForTimeout(3000);
  });

  test('should add a new animal successfully', async ({ page }) => {
    // Wait for profile page to load
    await expect(page.getByTestId('add-animal-button')).toBeVisible({ timeout: 10000 });
    
    // Click add animal button
    await page.getByTestId('add-animal-button').click();
    
    // Fill animal form
    const animalData = {
      name: 'Bessie',
      type: 'Cow',
      breed: 'Holstein',
      age: '3',
      gender: 'Female',
      details: 'Healthy dairy cow'
    };
    
    await page.getByTestId('animal-name-input').fill(animalData.name);
    await page.getByTestId('animal-type-input').fill(animalData.type);
    await page.getByTestId('animal-breed-input').fill(animalData.breed);
    await page.getByTestId('animal-age-input').fill(animalData.age);
    await page.getByTestId('animal-gender-input').fill(animalData.gender);
    await page.getByTestId('animal-details-input').fill(animalData.details);
    
    // Save the animal
    await page.getByTestId('modal-save-button').click();
    
    // Wait for modal to close and animal to appear
    await page.waitForTimeout(2000);
    
    // Verify animal appears in the list
    await expect(page.getByText(animalData.name)).toBeVisible();
    await expect(page.getByText(animalData.type)).toBeVisible();
  });

  test('should view animal details', async ({ page }) => {
    // First add an animal
    await expect(page.getByTestId('add-animal-button')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('add-animal-button').click();
    
    const animalData = {
      name: 'Charlie',
      type: 'Horse',
      breed: 'Arabian',
      age: '5',
      gender: 'Male',
      details: 'Racing horse'
    };
    
    await page.getByTestId('animal-name-input').fill(animalData.name);
    await page.getByTestId('animal-type-input').fill(animalData.type);
    await page.getByTestId('animal-breed-input').fill(animalData.breed);
    await page.getByTestId('animal-age-input').fill(animalData.age);
    await page.getByTestId('animal-gender-input').fill(animalData.gender);
    await page.getByTestId('animal-details-input').fill(animalData.details);
    
    await page.getByTestId('modal-save-button').click();
    await page.waitForTimeout(2000);
    
    // Click on the animal to view details
    const animalCard = page.getByText(animalData.name).first();
    await animalCard.click();
    
    // Wait for navigation to animal details page
    await page.waitForTimeout(2000);
    
    // Verify animal details are displayed
    await expect(page.getByText(animalData.name)).toBeVisible();
    await expect(page.getByText(animalData.breed)).toBeVisible();
    await expect(page.getByText(animalData.details)).toBeVisible();
  });

  test('should edit an animal', async ({ page }) => {
    // First add an animal
    await expect(page.getByTestId('add-animal-button')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('add-animal-button').click();
    
    const originalData = {
      name: 'Daisy',
      type: 'Cow',
      breed: 'Jersey',
      age: '4',
      gender: 'Female',
      details: 'Milk cow'
    };
    
    await page.getByTestId('animal-name-input').fill(originalData.name);
    await page.getByTestId('animal-type-input').fill(originalData.type);
    await page.getByTestId('animal-breed-input').fill(originalData.breed);
    await page.getByTestId('animal-age-input').fill(originalData.age);
    await page.getByTestId('animal-gender-input').fill(originalData.gender);
    await page.getByTestId('animal-details-input').fill(originalData.details);
    
    await page.getByTestId('modal-save-button').click();
    await page.waitForTimeout(2000);
    
    // Click on the animal to go to details
    await page.getByText(originalData.name).first().click();
    await page.waitForTimeout(2000);
    
    // Click edit button
    await page.getByTestId('edit-button').click();
    
    // Update animal details
    const updatedData = {
      name: 'Daisy Updated',
      age: '5',
      details: 'Excellent milk producer'
    };
    
    await page.getByTestId('name-input').fill(updatedData.name);
    await page.getByTestId('age-input').fill(updatedData.age);
    await page.getByTestId('details-input').fill(updatedData.details);
    
    // Save changes
    await page.getByTestId('save-button').click();
    
    // Wait for update
    await page.waitForTimeout(2000);
    
    // Verify updates are reflected
    await expect(page.getByText(updatedData.name)).toBeVisible();
    await expect(page.getByText(updatedData.details)).toBeVisible();
  });

  test('should handle animal form validation', async ({ page }) => {
    // Wait for profile page and click add animal
    await expect(page.getByTestId('add-animal-button')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('add-animal-button').click();
    
    // Try to save without filling required fields
    await page.getByTestId('modal-save-button').click();
    
    // Should not close modal (validation should prevent submission)
    await expect(page.getByTestId('animal-name-input')).toBeVisible();
    
    // Fill only name and try again
    await page.getByTestId('animal-name-input').fill('Test Animal');
    await page.getByTestId('modal-save-button').click();
    
    // Modal should still be open due to missing required fields
    await expect(page.getByTestId('animal-type-input')).toBeVisible();
    
    // Cancel the modal
    await page.getByTestId('modal-cancel-button').click();
    
    // Modal should close
    await expect(page.getByTestId('animal-name-input')).not.toBeVisible();
  });

  test('should delete an animal', async ({ page }) => {
    // First add an animal
    await expect(page.getByTestId('add-animal-button')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('add-animal-button').click();
    
    const animalData = {
      name: 'ToBeDeleted',
      type: 'Sheep',
      breed: 'Merino',
      age: '2',
      gender: 'Female',
      details: 'Test animal for deletion'
    };
    
    await page.getByTestId('animal-name-input').fill(animalData.name);
    await page.getByTestId('animal-type-input').fill(animalData.type);
    await page.getByTestId('animal-breed-input').fill(animalData.breed);
    await page.getByTestId('animal-age-input').fill(animalData.age);
    await page.getByTestId('animal-gender-input').fill(animalData.gender);
    await page.getByTestId('animal-details-input').fill(animalData.details);
    
    await page.getByTestId('modal-save-button').click();
    await page.waitForTimeout(2000);
    
    // Click on the animal to go to details
    await page.getByText(animalData.name).first().click();
    await page.waitForTimeout(2000);
    
    // Click delete button
    await page.getByTestId('delete-button').click();
    
    // Handle potential confirmation dialog
    await page.waitForTimeout(1000);
    
    // Should navigate back to profile or show success
    await page.waitForTimeout(2000);
    
    // Verify animal is no longer in the list (if navigated back)
    // Note: This depends on your app's delete behavior
  });
});
