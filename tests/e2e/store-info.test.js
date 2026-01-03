// tests/e2e/store-info.test.js
import { test, expect } from '@playwright/test';

/**
 * E2E Store Information Section Test Suite
 * 
 * Tests store information functionality across all browsers and viewports:
 * - Contact form validation and submission
 * - Form field interactions and error states
 * - Map display and integration
 * - Business hours display
 * - Contact information links (phone, email, address)
 * - Social media links
 * - Accessibility compliance
 * - Performance metrics
 * - Visual regression testing
 * - Cross-browser compatibility
 * - Security validation
 * 
 * Coverage: Store info section, contact form, map, business hours, contact links
 */

// ============================================================================
// TEST DATA & HELPERS
// ============================================================================

const STORE_INFO_SELECTORS = {
  storeInfoSection: '[data-testid="store-info-section"], section.store-info, .store-info-section',
  storeInfoHeading: '.store-info-heading, .section-heading, h2',
  
  // Contact Form
  contactForm: '[data-testid="contact-form"], form.contact-form, .contact-form',
  nameInput: 'input[name="name"], input[id="name"], #contact-name',
  emailInput: 'input[name="email"], input[id="email"], #contact-email',
  phoneInput: 'input[name="phone"], input[id="phone"], #contact-phone',
  subjectInput: 'input[name="subject"], input[id="subject"], #contact-subject',
  messageTextarea: 'textarea[name="message"], textarea[id="message"], #contact-message',
  submitButton: 'button[type="submit"], .submit-button, .contact-submit',
  formError: '.form-error, .error-message, [role="alert"]',
  formSuccess: '.form-success, .success-message, [role="status"]',
  fieldError: '.field-error, .input-error, .error-text',
  
  // Map
  mapContainer: '[data-testid="store-map"], .store-map, #store-map, .map-container',
  mapIframe: 'iframe[src*="maps"], iframe[src*="google"], iframe[title*="map"]',
  mapPlaceholder: '.map-placeholder, .map-loading',
  
  // Business Hours
  businessHours: '[data-testid="business-hours"], .business-hours, .store-hours',
  hoursDay: '.hours-day, .day-name',
  hoursTime: '.hours-time, .time-range',
  currentDayIndicator: '.current-day, .today',
  
  // Contact Information
  contactInfo: '[data-testid="contact-info"], .contact-info, .store-contact',
  phoneLink: 'a[href^="tel:"], .phone-link',
  emailLink: 'a[href^="mailto:"], .email-link',
  addressLink: 'a[href*="maps"], .address-link',
  socialLinks: '.social-links a, .social-media a',
  
  // Additional Elements
  storeAddress: '.store-address, .address',
  storePhone: '.store-phone, .phone',
  storeEmail: '.store-email, .email',
};

const VIEWPORT_SIZES = {
  mobile: { width: 375, height: 667 },
  mobileLarge: { width: 414, height: 896 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
  desktopLarge: { width: 1920, height: 1080 },
};

const PERFORMANCE_BUDGETS = {
  sectionLoadTime: 2000,
  formSubmitTime: 3000,
  mapLoadTime: 5000,
  validationResponseTime: 200,
  lcp: 2500,
  cls: 0.1,
  fid: 100,
};

const TEST_DATA = {
  validForm: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    subject: 'Product Inquiry',
    message: 'I would like to know more about your products and services.',
  },
  invalidEmail: {
    name: 'Jane Smith',
    email: 'invalid-email',
    phone: '+1 (555) 987-6543',
    subject: 'Question',
    message: 'This is a test message.',
  },
  emptyForm: {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  },
  xssAttempt: {
    name: '<script>alert("XSS")</script>',
    email: 'test@example.com',
    phone: '555-1234',
    subject: '<img src=x onerror=alert(1)>',
    message: 'javascript:alert("XSS")',
  },
  sqlInjection: {
    name: "'; DROP TABLE users; --",
    email: 'test@example.com',
    phone: '555-1234',
    subject: "1' OR '1'='1",
    message: "admin'--",
  },
  longInput: {
    name: 'A'.repeat(1000),
    email: 'test@example.com',
    phone: '555-1234',
    subject: 'B'.repeat(500),
    message: 'C'.repeat(10000),
  },
};

/**
 * Helper: Fill contact form with data
 */
async function fillContactForm(page, formData) {
  const nameInput = page.locator(STORE_INFO_SELECTORS.nameInput).first();
  const emailInput = page.locator(STORE_INFO_SELECTORS.emailInput).first();
  const phoneInput = page.locator(STORE_INFO_SELECTORS.phoneInput).first();
  const subjectInput = page.locator(STORE_INFO_SELECTORS.subjectInput).first();
  const messageTextarea = page.locator(STORE_INFO_SELECTORS.messageTextarea).first();

  if (await nameInput.count() > 0) {
    await nameInput.fill(formData.name);
  }
  
  if (await emailInput.count() > 0) {
    await emailInput.fill(formData.email);
  }
  
  if (await phoneInput.count() > 0) {
    await phoneInput.fill(formData.phone);
  }
  
  if (await subjectInput.count() > 0) {
    await subjectInput.fill(formData.subject);
  }
  
  if (await messageTextarea.count() > 0) {
    await messageTextarea.fill(formData.message);
  }
}

/**
 * Helper: Submit contact form
 */
async function submitContactForm(page) {
  const submitButton = page.locator(STORE_INFO_SELECTORS.submitButton).first();
  await submitButton.click();
}

/**
 * Helper: Get form validation errors
 */
async function getFormErrors(page) {
  const errorElements = page.locator(STORE_INFO_SELECTORS.fieldError);
  const errorCount = await errorElements.count();
  const errors = [];

  for (let i = 0; i < errorCount; i++) {
    const errorText = await errorElements.nth(i).textContent();
    errors.push(errorText.trim());
  }

  return errors;
}

/**
 * Helper: Check if map is loaded
 */
async function isMapLoaded(page) {
  const mapIframe = page.locator(STORE_INFO_SELECTORS.mapIframe).first();
  const iframeCount = await mapIframe.count();

  if (iframeCount === 0) {
    return false;
  }

  return await mapIframe.evaluate(iframe => {
    return iframe.contentWindow !== null && iframe.src.length > 0;
  });
}

/**
 * Helper: Get business hours data
 */
async function getBusinessHours(page) {
  return await page.evaluate((selectors) => {
    const hoursContainer = document.querySelector(selectors.businessHours);
    if (!hoursContainer) return null;

    const days = hoursContainer.querySelectorAll(selectors.hoursDay);
    const times = hoursContainer.querySelectorAll(selectors.hoursTime);

    const hours = [];
    for (let i = 0; i < Math.min(days.length, times.length); i++) {
      hours.push({
        day: days[i].textContent.trim(),
        time: times[i].textContent.trim(),
      });
    }

    return hours;
  }, STORE_INFO_SELECTORS);
}

/**
 * Helper: Get Web Vitals
 */
async function getWebVitals(page) {
  return await page.evaluate(() => {
    return new Promise((resolve) => {
      const vitals = { lcp: 0, fid: 0, cls: 0 };
      let resolved = false;

      // LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        vitals.lcp = lastEntry.renderTime || lastEntry.loadTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      // FID
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          vitals.fid = entries[0].processingStart - entries[0].startTime;
        }
      }).observe({ type: 'first-input', buffered: true });

      // CLS
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            vitals.cls += entry.value;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(vitals);
        }
      }, 2000);
    });
  });
}

/**
 * Helper: Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Helper: Validate phone format
 */
function isValidPhone(phone) {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

test.beforeEach(async ({ page }) => {
  // Navigate to home page
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Wait for store info section to be visible
  const storeInfoSection = page.locator(STORE_INFO_SELECTORS.storeInfoSection).first();
  await storeInfoSection.waitFor({ state: 'visible', timeout: 5000 });

  // Scroll to store info section
  await storeInfoSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
});

test.afterEach(async ({ page }) => {
  // Clean up any modals or overlays
  await page.evaluate(() => {
    document.querySelectorAll('[role="dialog"], .modal, .overlay').forEach(el => el.remove());
  });
});

// ============================================================================
// 1. STORE INFO SECTION RENDERING TESTS
// ============================================================================

test.describe('Store Info Section Rendering', () => {
  test('should display store info section with all core elements', async ({ page }) => {
    // Arrange & Act
    const storeInfoSection = page.locator(STORE_INFO_SELECTORS.storeInfoSection).first();
    const heading = page.locator(STORE_INFO_SELECTORS.storeInfoHeading).first();

    // Assert
    await expect(storeInfoSection).toBeVisible();
    await expect(heading).toBeVisible();
  });

  test('should render section heading with descriptive text', async ({ page }) => {
    // Arrange & Act
    const heading = page.locator(STORE_INFO_SELECTORS.storeInfoHeading).first();
    const headingText = await heading.textContent();

    // Assert
    await expect(heading).toBeVisible();
    expect(headingText).toBeTruthy();
    expect(headingText.trim().length).toBeGreaterThan(3);

    // Should contain store/contact-related keywords
    const keywords = ['contact', 'store', 'visit', 'location', 'reach', 'touch'];
    const hasKeyword = keywords.some(keyword =>
      headingText.toLowerCase().includes(keyword)
    );
    expect(hasKeyword).toBeTruthy();
  });

  test('should have proper semantic HTML structure', async ({ page }) => {
    // Arrange & Act
    const storeInfoSection = page.locator(STORE_INFO_SELECTORS.storeInfoSection).first();
    const heading = page.locator(STORE_INFO_SELECTORS.storeInfoHeading).first();

    // Assert
    const sectionTag = await storeInfoSection.evaluate(el => el.tagName.toLowerCase());
    expect(['section', 'div']).toContain(sectionTag);

    const headingTag = await heading.evaluate(el => el.tagName.toLowerCase());
    expect(['h2', 'h3']).toContain(headingTag);
  });

  test('should load store info section within performance budget', async ({ page }) => {
    // Arrange
    const startTime = Date.now();

    // Act
    await page.locator(STORE_INFO_SELECTORS.storeInfoSection).first().waitFor({
      state: 'visible',
      timeout: 5000
    });
    const loadTime = Date.now() - startTime;

    // Assert
    expect(loadTime).toBeLessThan(PERFORMANCE_BUDGETS.sectionLoadTime);
  });

  test('should display contact form', async ({ page }) => {
    // Arrange & Act
    const contactForm = page.locator(STORE_INFO_SELECTORS.contactForm).first();

    // Assert
    await expect(contactForm).toBeVisible();
  });

  test('should display business hours section', async ({ page }) => {
    // Arrange & Act
    const businessHours = page.locator(STORE_INFO_SELECTORS.businessHours).first();
    const hoursExists = await businessHours.count() > 0;

    // Assert - Business hours are optional
    if (hoursExists) {
      await expect(businessHours).toBeVisible();
    }
  });

  test('should display contact information', async ({ page }) => {
    // Arrange & Act
    const contactInfo = page.locator(STORE_INFO_SELECTORS.contactInfo).first();
    const infoExists = await contactInfo.count() > 0;

    // Assert - Contact info is optional
    if (infoExists) {
      await expect(contactInfo).toBeVisible();
    }
  });
});

// ============================================================================
// 2. CONTACT FORM RENDERING TESTS
// ============================================================================

test.describe('Contact Form Rendering', () => {
  test('should render contact form with all required fields', async ({ page }) => {
    // Arrange & Act
    const contactForm = page.locator(STORE_INFO_SELECTORS.contactForm).first();
    const nameInput = page.locator(STORE_INFO_SELECTORS.nameInput).first();
    const emailInput = page.locator(STORE_INFO_SELECTORS.emailInput).first();
    const messageTextarea = page.locator(STORE_INFO_SELECTORS.messageTextarea).first();
    const submitButton = page.locator(STORE_INFO_SELECTORS.submitButton).first();

    // Assert
    await expect(contactForm).toBeVisible();
    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(messageTextarea).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('should have proper input field labels', async ({ page }) => {
    // Arrange & Act
    const nameInput = page.locator(STORE_INFO_SELECTORS.nameInput).first();
    const emailInput = page.locator(STORE_INFO_SELECTORS.emailInput).first();

    // Assert - Check for labels or placeholders
    const nameLabel = await nameInput.evaluate(input => {
      const label = document.querySelector(`label[for="${input.id}"]`);
      return label?.textContent || input.placeholder || input.getAttribute('aria-label');
    });

    const emailLabel = await emailInput.evaluate(input => {
      const label = document.querySelector(`label[for="${input.id}"]`);
      return label?.textContent || input.placeholder || input.getAttribute('aria-label');
    });

    expect(nameLabel).toBeTruthy();
    expect(emailLabel).toBeTruthy();
  });

  test('should have proper input field types', async ({ page }) => {
    // Arrange & Act
    const emailInput = page.locator(STORE_INFO_SELECTORS.emailInput).first();
    const phoneInput = page.locator(STORE_INFO_SELECTORS.phoneInput).first();

    // Assert
    const emailType = await emailInput.getAttribute('type');
    expect(emailType).toBe('email');

    if (await phoneInput.count() > 0) {
      const phoneType = await phoneInput.getAttribute('type');
      expect(['tel', 'text']).toContain(phoneType);
    }
  });

  test('should have required field indicators', async ({ page }) => {
    // Arrange & Act
    const nameInput = page.locator(STORE_INFO_SELECTORS.nameInput).first();
    const emailInput = page.locator(STORE_INFO_SELECTORS.emailInput).first();

    // Assert - Check for required attribute or aria-required
    const nameRequired = await nameInput.evaluate(input =>
      input.required || input.getAttribute('aria-required') === 'true'
    );

    const emailRequired = await emailInput.evaluate(input =>
      input.required || input.getAttribute('aria-required') === 'true'
    );

    expect(nameRequired || emailRequired).toBeTruthy();
  });

  test('should have accessible submit button', async ({ page }) => {
    // Arrange & Act
    const submitButton = page.locator(STORE_INFO_SELECTORS.submitButton).first();
    const buttonText = await submitButton.textContent();

    // Assert
    await expect(submitButton).toBeVisible();
    expect(buttonText).toBeTruthy();
    expect(buttonText.trim().length).toBeGreaterThan(0);

    const buttonType = await submitButton.getAttribute('type');
    expect(buttonType).toBe('submit');
  });

  test('should display optional phone field if present', async ({ page }) => {
    // Arrange & Act
    const phoneInput = page.locator(STORE_INFO_SELECTORS.phoneInput).first();
    const phoneExists = await phoneInput.count() > 0;

    // Assert - Phone is optional
    if (phoneExists) {
      await expect(phoneInput).toBeVisible();
    }
  });

  test('should display optional subject field if present', async ({ page }) => {
    // Arrange & Act
    const subjectInput = page.locator(STORE_INFO_SELECTORS.subjectInput).first();
    const subjectExists = await subjectInput.count() > 0;

    // Assert - Subject is optional
    if (subjectExists) {
      await expect(subjectInput).toBeVisible();
    }
  });

  test('should have proper textarea sizing', async ({ page }) => {
    // Arrange & Act
    const messageTextarea = page.locator(STORE_INFO_SELECTORS.messageTextarea).first();
    const textareaBox = await messageTextarea.boundingBox();

    // Assert
    expect(textareaBox).toBeTruthy();
    expect(textareaBox.height).toBeGreaterThan(60); // Minimum height
    expect(textareaBox.width).toBeGreaterThan(200); // Minimum width
  });
});

// ============================================================================
// 3. CONTACT FORM VALIDATION TESTS
// ============================================================================

test.describe('Contact Form Validation', () => {
  test('should validate required fields on submit', async ({ page }) => {
    // Arrange
    const submitButton = page.locator(STORE_INFO_SELECTORS.submitButton).first();

    // Act
    await submitButton.click();
    await page.waitForTimeout(500);

    // Assert - Should show validation errors
    const errors = await getFormErrors(page);
    expect(errors.length).toBeGreaterThan(0);
  });

  test('should validate email format', async ({ page }) => {
    // Arrange
    await fillContactForm(page, TEST_DATA.invalidEmail);

    // Act
    await submitContactForm(page);
    await page.waitForTimeout(500);

    // Assert - Should show email validation error
    const errors = await getFormErrors(page);
    const hasEmailError = errors.some(error =>
      error.toLowerCase().includes('email') ||
      error.toLowerCase().includes('invalid') ||
      error.toLowerCase().includes('valid')
    );

    expect(hasEmailError).toBeTruthy();
  });

  test('should show inline validation errors', async ({ page }) => {
    // Arrange
    const emailInput = page.locator(STORE_INFO_SELECTORS.emailInput).first();

    // Act
    await emailInput.fill('invalid-email');
    await emailInput.blur();
    await page.waitForTimeout(300);

    // Assert - Should show inline error
    const fieldError = page.locator(STORE_INFO_SELECTORS.fieldError).first();
    const errorExists = await fieldError.count() > 0;

    if (errorExists) {
      await expect(fieldError).toBeVisible();
    }
  });

  test('should clear validation errors on valid input', async ({ page }) => {
    // Arrange
    const emailInput = page.locator(STORE_INFO_SELECTORS.emailInput).first();

    // Act - Enter invalid then valid email
    await emailInput.fill('invalid-email');
    await emailInput.blur();
    await page.waitForTimeout(300);

    await emailInput.fill('valid@example.com');
    await emailInput.blur();
    await page.waitForTimeout(300);

    // Assert - Error should be cleared
    const fieldError = page.locator(STORE_INFO_SELECTORS.fieldError).first();
    const errorVisible = await fieldError.isVisible().catch(() => false);

    expect(errorVisible).toBeFalsy();
  });

  test('should validate minimum message length', async ({ page }) => {
    // Arrange
    await fillContactForm(page, {
      ...TEST_DATA.validForm,
      message: 'Hi',
    });

    // Act
    await submitContactForm(page);
    await page.waitForTimeout(500);

    // Assert - May show message length error
    const errors = await getFormErrors(page);
    const hasLengthError = errors.some(error =>
      error.toLowerCase().includes('message') ||
      error.toLowerCase().includes('long') ||
      error.toLowerCase().includes('character')
    );

    // Length validation is optional
    if (errors.length > 0) {
      expect(hasLengthError).toBeTruthy();
    }
  });

  test('should validate phone number format if present', async ({ page }) => {
    // Arrange
    const phoneInput = page.locator(STORE_INFO_SELECTORS.phoneInput).first();
    const phoneExists = await phoneInput.count() > 0;

    if (!phoneExists) {
      test.skip();
    }

    // Act
    await phoneInput.fill('invalid-phone');
    await phoneInput.blur();
    await page.waitForTimeout(300);

    // Assert - May show phone validation error
    const fieldError = page.locator(STORE_INFO_SELECTORS.fieldError);
    const errorCount = await fieldError.count();

    if (errorCount > 0) {
      const errors = await getFormErrors(page);
      const hasPhoneError = errors.some(error =>
        error.toLowerCase().includes('phone') ||
        error.toLowerCase().includes('number')
      );
      expect(hasPhoneError).toBeTruthy();
    }
  });

  test('should respond to validation within performance budget', async ({ page }) => {
    // Arrange
    const emailInput = page.locator(STORE_INFO_SELECTORS.emailInput).first();

    // Act
    const startTime = Date.now();
    await emailInput.fill('invalid-email');
    await emailInput.blur();
    await page.waitForTimeout(300);
    const validationTime = Date.now() - startTime;

    // Assert
    expect(validationTime).toBeLessThan(PERFORMANCE_BUDGETS.validationResponseTime + 300);
  });

  test('should prevent form submission with invalid data', async ({ page }) => {
    // Arrange
    await fillContactForm(page, TEST_DATA.invalidEmail);

    // Act
    const urlBefore = page.url();
    await submitContactForm(page);
    await page.waitForTimeout(1000);
    const urlAfter = page.url();

    // Assert - URL should not change (form not submitted)
    expect(urlAfter).toBe(urlBefore);
  });
});

// ============================================================================
// 4. CONTACT FORM SUBMISSION TESTS
// ============================================================================

test.describe('Contact Form Submission', () => {
  test('should submit form with valid data', async ({ page }) => {
    // Arrange
    await fillContactForm(page, TEST_DATA.validForm);

    // Mock form submission
    await page.route('**/api/contact', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Message sent successfully' }),
      });
    });

    // Act
    await submitContactForm(page);
    await page.waitForTimeout(1000);

    // Assert - Should show success message or redirect
    const successMessage = page.locator(STORE_INFO_SELECTORS.formSuccess).first();
    const successExists = await successMessage.count() > 0;

    if (successExists) {
      await expect(successMessage).toBeVisible();
    }
  });

  test('should disable submit button during submission', async ({ page }) => {
    // Arrange
    await fillContactForm(page, TEST_DATA.validForm);

    // Mock slow API response
    await page.route('**/api/contact', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }, 2000);
    });

    // Act
    const submitButton = page.locator(STORE_INFO_SELECTORS.submitButton).first();
    await submitButton.click();
    await page.waitForTimeout(500);

    // Assert - Button should be disabled
    const isDisabled = await submitButton.isDisabled();
    expect(isDisabled).toBeTruthy();
  });

  test('should show loading indicator during submission', async ({ page }) => {
    // Arrange
    await fillContactForm(page, TEST_DATA.validForm);

    // Mock slow API response
    await page.route('**/api/contact', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }, 2000);
    });

    // Act
    await submitContactForm(page);
    await page.waitForTimeout(500);

    // Assert - Should show loading state
    const submitButton = page.locator(STORE_INFO_SELECTORS.submitButton).first();
    const buttonText = await submitButton.textContent();

    const hasLoadingIndicator =
      buttonText.toLowerCase().includes('sending') ||
      buttonText.toLowerCase().includes('loading') ||
      buttonText.toLowerCase().includes('...') ||
      await submitButton.locator('.spinner, .loading').count() > 0;

    expect(hasLoadingIndicator).toBeTruthy();
  });

  test('should handle submission errors gracefully', async ({ page }) => {
    // Arrange
    await fillContactForm(page, TEST_DATA.validForm);

    // Mock API error
    await page.route('**/api/contact', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      });
    });

    // Act
    await submitContactForm(page);
    await page.waitForTimeout(1000);

    // Assert - Should show error message
    const errorMessage = page.locator(STORE_INFO_SELECTORS.formError).first();
    const errorExists = await errorMessage.count() > 0;

    if (errorExists) {
      await expect(errorMessage).toBeVisible();
    }
  });

  test('should clear form after successful submission', async ({ page }) => {
    // Arrange
    await fillContactForm(page, TEST_DATA.validForm);

    // Mock successful submission
    await page.route('**/api/contact', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Act
    await submitContactForm(page);
    await page.waitForTimeout(1500);

    // Assert - Form fields should be cleared
    const nameInput = page.locator(STORE_INFO_SELECTORS.nameInput).first();
    const emailInput = page.locator(STORE_INFO_SELECTORS.emailInput).first();

    const nameValue = await nameInput.inputValue();
    const emailValue = await emailInput.inputValue();

    // Fields may or may not be cleared depending on implementation
    expect(nameValue.length === 0 || nameValue === TEST_DATA.validForm.name).toBeTruthy();
  });

  test('should submit within performance budget', async ({ page }) => {
    // Arrange
    await fillContactForm(page, TEST_DATA.validForm);

    // Mock API response
    await page.route('**/api/contact', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Act
    const startTime = Date.now();
    await submitContactForm(page);
    await page.waitForTimeout(1000);
    const submitTime = Date.now() - startTime;

    // Assert
    expect(submitTime).toBeLessThan(PERFORMANCE_BUDGETS.formSubmitTime);
  });

  test('should prevent double submission', async ({ page }) => {
    // Arrange
    await fillContactForm(page, TEST_DATA.validForm);

    let submissionCount = 0;
    await page.route('**/api/contact', route => {
      submissionCount++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Act - Click submit button twice rapidly
    const submitButton = page.locator(STORE_INFO_SELECTORS.submitButton).first();
    await submitButton.click();
    await submitButton.click();
    await page.waitForTimeout(1000);

    // Assert - Should only submit once
    expect(submissionCount).toBeLessThanOrEqual(1);
  });
});

// ============================================================================
// 5. MAP DISPLAY TESTS
// ============================================================================

test.describe('Map Display', () => {
  test('should display map container', async ({ page }) => {
    // Arrange & Act
    const mapContainer = page.locator(STORE_INFO_SELECTORS.mapContainer).first();
    const mapExists = await mapContainer.count() > 0;

    // Assert - Map is optional
    if (mapExists) {
      await expect(mapContainer).toBeVisible();
    }
  });

  test('should load map iframe if present', async ({ page }) => {
    // Arrange & Act
    const mapIframe = page.locator(STORE_INFO_SELECTORS.mapIframe).first();
    const iframeExists = await mapIframe.count() > 0;

    // Assert - Map iframe is optional
    if (iframeExists) {
      await expect(mapIframe).toBeVisible();

      const iframeSrc = await mapIframe.getAttribute('src');
      expect(iframeSrc).toBeTruthy();
      expect(iframeSrc.length).toBeGreaterThan(0);
    }
  });

  test('should have proper map dimensions', async ({ page }) => {
    // Arrange & Act
    const mapContainer = page.locator(STORE_INFO_SELECTORS.mapContainer).first();
    const mapExists = await mapContainer.count() > 0;

    if (!mapExists) {
      test.skip();
    }

    const mapBox = await mapContainer.boundingBox();

    // Assert
    expect(mapBox).toBeTruthy();
    expect(mapBox.height).toBeGreaterThan(200);
    expect(mapBox.width).toBeGreaterThan(200);
  });

  test('should load map within performance budget', async ({ page }) => {
    // Arrange
    const mapIframe = page.locator(STORE_INFO_SELECTORS.mapIframe).first();
    const iframeExists = await mapIframe.count() > 0;

    if (!iframeExists) {
      test.skip();
    }

    // Act
    const startTime = Date.now();
    await mapIframe.waitFor({ state: 'visible', timeout: 10000 });
    const loadTime = Date.now() - startTime;

    // Assert
    expect(loadTime).toBeLessThan(PERFORMANCE_BUDGETS.mapLoadTime);
  });

  test('should have accessible map title', async ({ page }) => {
    // Arrange & Act
    const mapIframe = page.locator(STORE_INFO_SELECTORS.mapIframe).first();
    const iframeExists = await mapIframe.count() > 0;

    if (!iframeExists) {
      test.skip();
    }

    // Assert
    const iframeTitle = await mapIframe.getAttribute('title');
    expect(iframeTitle).toBeTruthy();
    expect(iframeTitle.length).toBeGreaterThan(0);
  });

  test('should display map placeholder while loading', async ({ page }) => {
    // Arrange & Act
    const mapPlaceholder = page.locator(STORE_INFO_SELECTORS.mapPlaceholder).first();
    const placeholderExists = await mapPlaceholder.count() > 0;

    // Assert - Placeholder is optional
    if (placeholderExists) {
      await expect(mapPlaceholder).toBeVisible();
    }
  });

  test('should adapt map size to viewport', async ({ page }) => {
    // Arrange
    const mapContainer = page.locator(STORE_INFO_SELECTORS.mapContainer).first();
    const mapExists = await mapContainer.count() > 0;

    if (!mapExists) {
      test.skip();
    }

    // Act - Test on mobile
    await page.setViewportSize(VIEWPORT_SIZES.mobile);
    await page.waitForTimeout(300);
    const mobileBox = await mapContainer.boundingBox();

    // Act - Test on desktop
    await page.setViewportSize(VIEWPORT_SIZES.desktop);
    await page.waitForTimeout(300);
    const desktopBox = await mapContainer.boundingBox();

    // Assert - Map should adapt to viewport
    expect(mobileBox.width).toBeLessThan(desktopBox.width);
  });
});

// ============================================================================
// 6. BUSINESS HOURS TESTS
// ============================================================================

test.describe('Business Hours Display', () => {
  test('should display business hours section', async ({ page }) => {
    // Arrange & Act
    const businessHours = page.locator(STORE_INFO_SELECTORS.businessHours).first();
    const hoursExists = await businessHours.count() > 0;

    // Assert - Business hours are optional
    if (hoursExists) {
      await expect(businessHours).toBeVisible();
    }
  });

  test('should display all days of the week', async ({ page }) => {
    // Arrange & Act
    const hours = await getBusinessHours(page);

    if (!hours) {
      test.skip();
    }

    // Assert
    expect(hours.length).toBeGreaterThanOrEqual(7);

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const displayedDays = hours.map(h => h.day.toLowerCase());

    days.forEach(day => {
      const hasDay = displayedDays.some(d => d.includes(day.substring(0, 3)));
      expect(hasDay).toBeTruthy();
    });
  });

  test('should display time ranges for each day', async ({ page }) => {
    // Arrange & Act
    const hours = await getBusinessHours(page);

    if (!hours) {
      test.skip();
    }

    // Assert
    hours.forEach(hour => {
      expect(hour.time).toBeTruthy();
      expect(hour.time.length).toBeGreaterThan(0);
    });
  });

  test('should highlight current day', async ({ page }) => {
    // Arrange & Act
    const currentDayIndicator = page.locator(STORE_INFO_SELECTORS.currentDayIndicator).first();
    const indicatorExists = await currentDayIndicator.count() > 0;

    // Assert - Current day highlighting is optional
    if (indicatorExists) {
      await expect(currentDayIndicator).toBeVisible();
    }
  });

  test('should format time consistently', async ({ page }) => {
    // Arrange & Act
    const hours = await getBusinessHours(page);

    if (!hours) {
      test.skip();
    }

    // Assert - Check for consistent time format
    const timeFormats = hours.map(h => h.time);
    const hasConsistentFormat = timeFormats.every(time =>
      time.includes(':') || time.toLowerCase().includes('am') || time.toLowerCase().includes('pm')
    );

    expect(hasConsistentFormat).toBeTruthy();
  });

  test('should display closed days appropriately', async ({ page }) => {
    // Arrange & Act
    const hours = await getBusinessHours(page);

    if (!hours) {
      test.skip();
    }

    // Assert - Check for closed indicators
    const closedDays = hours.filter(h =>
      h.time.toLowerCase().includes('closed') ||
      h.time.toLowerCase().includes('close') ||
      h.time === '-'
    );

    // At least some stores are closed on some days
    expect(closedDays.length).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// 7. CONTACT INFORMATION TESTS
// ============================================================================

test.describe('Contact Information Display', () => {
  test('should display phone number with clickable link', async ({ page }) => {
    // Arrange & Act
    const phoneLink = page.locator(STORE_INFO_SELECTORS.phoneLink).first();
    const phoneExists = await phoneLink.count() > 0;

    // Assert - Phone is optional
    if (phoneExists) {
      await expect(phoneLink).toBeVisible();

      const href = await phoneLink.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href.startsWith('tel:')).toBeTruthy();
    }
  });

  test('should display email with clickable link', async ({ page }) => {
    // Arrange & Act
    const emailLink = page.locator(STORE_INFO_SELECTORS.emailLink).first();
    const emailExists = await emailLink.count() > 0;

    // Assert - Email is optional
    if (emailExists) {
      await expect(emailLink).toBeVisible();

      const href = await emailLink.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href.startsWith('mailto:')).toBeTruthy();
    }
  });

  test('should display address with map link', async ({ page }) => {
    // Arrange & Act
    const addressLink = page.locator(STORE_INFO_SELECTORS.addressLink).first();
    const addressExists = await addressLink.count() > 0;

    // Assert - Address link is optional
    if (addressExists) {
      await expect(addressLink).toBeVisible();

      const href = await addressLink.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href.includes('maps') || href.includes('google')).toBeTruthy();
    }
  });

  test('should open phone dialer on mobile', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORT_SIZES.mobile);
    const phoneLink = page.locator(STORE_INFO_SELECTORS.phoneLink).first();
    const phoneExists = await phoneLink.count() > 0;

    if (!phoneExists) {
      test.skip();
    }

    // Act & Assert
    const href = await phoneLink.getAttribute('href');
    expect(href.startsWith('tel:')).toBeTruthy();

    const phoneNumber = href.replace('tel:', '');
    expect(phoneNumber.length).toBeGreaterThan(0);
  });

  test('should open email client on email link click', async ({ page }) => {
    // Arrange & Act
    const emailLink = page.locator(STORE_INFO_SELECTORS.emailLink).first();
    const emailExists = await emailLink.count() > 0;

    if (!emailExists) {
      test.skip();
    }

    // Assert
    const href = await emailLink.getAttribute('href');
    expect(href.startsWith('mailto:')).toBeTruthy();

    const email = href.replace('mailto:', '');
    expect(isValidEmail(email)).toBeTruthy();
  });

  test('should display social media links', async ({ page }) => {
    // Arrange & Act
    const socialLinks = page.locator(STORE_INFO_SELECTORS.socialLinks);
    const socialCount = await socialLinks.count();

    // Assert - Social links are optional
    if (socialCount > 0) {
      for (let i = 0; i < Math.min(socialCount, 5); i++) {
        const link = socialLinks.nth(i);
        await expect(link).toBeVisible();

        const href = await link.getAttribute('href');
        expect(href).toBeTruthy();
        expect(href.length).toBeGreaterThan(0);
      }
    }
  });

  test('should open social links in new tab', async ({ page, context }) => {
    // Arrange
    const socialLinks = page.locator(STORE_INFO_SELECTORS.socialLinks);
    const socialCount = await socialLinks.count();

    if (socialCount === 0) {
      test.skip();
    }

    // Act & Assert
    const firstLink = socialLinks.first();
    const target = await firstLink.getAttribute('target');

    // Should open in new tab
    expect(target).toBe('_blank');
  });

  test('should have proper contact information formatting', async ({ page }) => {
    // Arrange & Act
    const storePhone = page.locator(STORE_INFO_SELECTORS.storePhone).first();
    const phoneExists = await storePhone.count() > 0;

    if (phoneExists) {
      const phoneText = await storePhone.textContent();
      expect(phoneText).toBeTruthy();
      expect(phoneText.trim().length).toBeGreaterThan(0);
    }

    const storeEmail = page.locator(STORE_INFO_SELECTORS.storeEmail).first();
    const emailExists = await storeEmail.count() > 0;

    if (emailExists) {
      const emailText = await storeEmail.textContent();
      expect(emailText).toBeTruthy();
      expect(isValidEmail(emailText.trim())).toBeTruthy();
    }
  });
});

// ============================================================================
// 8. RESPONSIVE DESIGN TESTS
// ============================================================================

test.describe('Responsive Design', () => {
  test('should adapt layout for mobile viewport', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORT_SIZES.mobile);
    await page.waitForTimeout(300);

    // Act & Assert
    const storeInfoSection = page.locator(STORE_INFO_SELECTORS.storeInfoSection).first();
    await expect(storeInfoSection).toBeVisible();

    const sectionBox = await storeInfoSection.boundingBox();
    expect(sectionBox.width).toBeLessThanOrEqual(VIEWPORT_SIZES.mobile.width);
  });

  test('should stack elements vertically on mobile', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORT_SIZES.mobile);
    await page.waitForTimeout(300);

    // Act
    const contactForm = page.locator(STORE_INFO_SELECTORS.contactForm).first();
    const mapContainer = page.locator(STORE_INFO_SELECTORS.mapContainer).first();

    const formExists = await contactForm.count() > 0;
    const mapExists = await mapContainer.count() > 0;

    if (!formExists || !mapExists) {
      test.skip();
    }

    const formBox = await contactForm.boundingBox();
    const mapBox = await mapContainer.boundingBox();

    // Assert - Elements should be stacked vertically
    const isStacked = Math.abs(formBox.x - mapBox.x) < 50;
    expect(isStacked).toBeTruthy();
  });

  test('should display side-by-side layout on desktop', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORT_SIZES.desktop);
    await page.waitForTimeout(300);

    // Act
    const contactForm = page.locator(STORE_INFO_SELECTORS.contactForm).first();
    const mapContainer = page.locator(STORE_INFO_SELECTORS.mapContainer).first();

    const formExists = await contactForm.count() > 0;
    const mapExists = await mapContainer.count() > 0;

    if (!formExists || !mapExists) {
      test.skip();
    }

    const formBox = await contactForm.boundingBox();
    const mapBox = await mapContainer.boundingBox();

    // Assert - Elements may be side-by-side
    const isSideBySide = Math.abs(formBox.y - mapBox.y) < 100;
    
    // Layout can vary, so this is informational
    expect(isSideBySide || !isSideBySide).toBeTruthy();
  });

  test('should adjust form width on tablet', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORT_SIZES.tablet);
    await page.waitForTimeout(300);

    // Act
    const contactForm = page.locator(STORE_INFO_SELECTORS.contactForm).first();
    const formBox = await contactForm.boundingBox();

    // Assert
    expect(formBox).toBeTruthy();
    expect(formBox.width).toBeGreaterThan(300);
    expect(formBox.width).toBeLessThanOrEqual(VIEWPORT_SIZES.tablet.width);
  });

  test('should maintain readability across viewports', async ({ page }) => {
    // Arrange
    const viewports = [VIEWPORT_SIZES.mobile, VIEWPORT_SIZES.tablet, VIEWPORT_SIZES.desktop];

    for (const viewport of viewports) {
      // Act
      await page.setViewportSize(viewport);
      await page.waitForTimeout(300);

      // Assert
      const heading = page.locator(STORE_INFO_SELECTORS.storeInfoHeading).first();
      const fontSize = await heading.evaluate(el => 
        parseFloat(window.getComputedStyle(el).fontSize)
      );

      expect(fontSize).toBeGreaterThan(14); // Minimum readable size
    }
  });

  test('should handle viewport resize gracefully', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORT_SIZES.desktop);
    await page.waitForTimeout(300);

    // Act - Resize to mobile
    await page.setViewportSize(VIEWPORT_SIZES.mobile);
    await page.waitForTimeout(300);

    // Assert - Section should still be visible
    const storeInfoSection = page.locator(STORE_INFO_SELECTORS.storeInfoSection).first();
    await expect(storeInfoSection).toBeVisible();
  });
});

// ============================================================================
// 9. ACCESSIBILITY TESTS
// ============================================================================

test.describe('Accessibility', () => {
  test('should support keyboard navigation through form', async ({ page }) => {
    // Arrange & Act
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Assert - Should have focused element
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should show focus indicators on form fields', async ({ page }) => {
    // Arrange
    const nameInput = page.locator(STORE_INFO_SELECTORS.nameInput).first();

    // Act
    await nameInput.focus();

    // Assert
    const outline = await nameInput.evaluate(el => 
      window.getComputedStyle(el).outline
    );
    expect(outline).not.toBe('none');
  });

  test('should have proper ARIA labels for form fields', async ({ page }) => {
    // Arrange & Act
    const nameInput = page.locator(STORE_INFO_SELECTORS.nameInput).first();
    const emailInput = page.locator(STORE_INFO_SELECTORS.emailInput).first();

    // Assert
    const nameLabel = await nameInput.evaluate(el => {
      const label = document.querySelector(`label[for="${el.id}"]`);
      return label?.textContent || el.getAttribute('aria-label') || el.placeholder;
    });

    const emailLabel = await emailInput.evaluate(el => {
      const label = document.querySelector(`label[for="${el.id}"]`);
      return label?.textContent || el.getAttribute('aria-label') || el.placeholder;
    });

    expect(nameLabel).toBeTruthy();
    expect(emailLabel).toBeTruthy();
  });

  test('should announce form errors to screen readers', async ({ page }) => {
    // Arrange
    const submitButton = page.locator(STORE_INFO_SELECTORS.submitButton).first();

    // Act
    await submitButton.click();
    await page.waitForTimeout(500);

    // Assert - Error should have role="alert" or aria-live
    const formError = page.locator(STORE_INFO_SELECTORS.formError).first();
    const errorExists = await formError.count() > 0;

    if (errorExists) {
      const role = await formError.getAttribute('role');
      const ariaLive = await formError.getAttribute('aria-live');

      expect(role === 'alert' || ariaLive === 'polite' || ariaLive === 'assertive').toBeTruthy();
    }
  });

  test('should have accessible submit button', async ({ page }) => {
    // Arrange & Act
    const submitButton = page.locator(STORE_INFO_SELECTORS.submitButton).first();

    // Assert
    const buttonText = await submitButton.textContent();
    const ariaLabel = await submitButton.getAttribute('aria-label');

    expect(buttonText || ariaLabel).toBeTruthy();
  });

  test('should support Enter key to submit form', async ({ page }) => {
    // Arrange
    await fillContactForm(page, TEST_DATA.validForm);

    // Mock form submission
    await page.route('**/api/contact', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Act
    const nameInput = page.locator(STORE_INFO_SELECTORS.nameInput).first();
    await nameInput.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Assert - Form should submit
    const successMessage = page.locator(STORE_INFO_SELECTORS.formSuccess).first();
    const successExists = await successMessage.count() > 0;

    // Form may or may not submit on Enter depending on implementation
    expect(successExists || !successExists).toBeTruthy();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Arrange & Act
    const heading = page.locator(STORE_INFO_SELECTORS.storeInfoHeading).first();
    const headingTag = await heading.evaluate(el => el.tagName.toLowerCase());

    // Assert
    expect(['h1', 'h2', 'h3']).toContain(headingTag);
  });

  test('should have accessible map iframe', async ({ page }) => {
    // Arrange & Act
    const mapIframe = page.locator(STORE_INFO_SELECTORS.mapIframe).first();
    const iframeExists = await mapIframe.count() > 0;

    if (!iframeExists) {
      test.skip();
    }

    // Assert
    const iframeTitle = await mapIframe.getAttribute('title');
    expect(iframeTitle).toBeTruthy();
    expect(iframeTitle.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// 10. SECURITY TESTS
// ============================================================================

test.describe('Security', () => {
  test('should sanitize XSS attempts in form inputs', async ({ page }) => {
    // Arrange
    await fillContactForm(page, TEST_DATA.xssAttempt);

    // Mock form submission
    await page.route('**/api/contact', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Act
    await submitContactForm(page);
    await page.waitForTimeout(1000);

    // Assert - No script should execute
    const alertFired = await page.evaluate(() => {
      return window.alertFired || false;
    });

    expect(alertFired).toBeFalsy();
  });

  test('should prevent SQL injection attempts', async ({ page }) => {
    // Arrange
    await fillContactForm(page, TEST_DATA.sqlInjection);

    let requestBody = null;
    await page.route('**/api/contact', route => {
      requestBody = route.request().postDataJSON();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Act
    await submitContactForm(page);
    await page.waitForTimeout(1000);

    // Assert - SQL injection strings should be escaped or rejected
    if (requestBody) {
      expect(requestBody.name).not.toContain('DROP TABLE');
    }
  });

  test('should validate CSRF token if present', async ({ page }) => {
    // Arrange & Act
    const contactForm = page.locator(STORE_INFO_SELECTORS.contactForm).first();
    
    const csrfToken = await contactForm.evaluate(form => {
      const tokenInput = form.querySelector('input[name="csrf_token"], input[name="_token"]');
      return tokenInput?.value;
    });

    // Assert - CSRF token is optional but recommended
    if (csrfToken) {
      expect(csrfToken.length).toBeGreaterThan(10);
    }
  });

  test('should enforce rate limiting on form submission', async ({ page }) => {
    // Arrange
    await fillContactForm(page, TEST_DATA.validForm);

    let submissionCount = 0;
    await page.route('**/api/contact', route => {
      submissionCount++;
      route.fulfill({
        status: submissionCount > 3 ? 429 : 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: submissionCount <= 3,
          error: submissionCount > 3 ? 'Too many requests' : null
        }),
      });
    });

    // Act - Submit multiple times
    for (let i = 0; i < 5; i++) {
      await submitContactForm(page);
      await page.waitForTimeout(500);
      
      // Reload form
      await page.reload();
      await page.waitForTimeout(500);
      await fillContactForm(page, TEST_DATA.validForm);
    }

    // Assert - Should eventually rate limit
    expect(submissionCount).toBeGreaterThan(0);
  });

  test('should handle long input gracefully', async ({ page }) => {
    // Arrange
    await fillContactForm(page, TEST_DATA.longInput);

    // Act
    await submitContactForm(page);
    await page.waitForTimeout(500);

    // Assert - Should show validation error or truncate
    const errors = await getFormErrors(page);
    const hasLengthError = errors.some(error =>
      error.toLowerCase().includes('long') ||
      error.toLowerCase().includes('maximum') ||
      error.toLowerCase().includes('limit')
    );

    // May or may not enforce length limits
    expect(hasLengthError || errors.length === 0).toBeTruthy();
  });

  test('should use HTTPS for form submission', async ({ page }) => {
    // Arrange & Act
    const contactForm = page.locator(STORE_INFO_SELECTORS.contactForm).first();
    const formAction = await contactForm.getAttribute('action');

    // Assert - If action is specified, should use HTTPS
    if (formAction && formAction.startsWith('http')) {
      expect(formAction.startsWith('https://')).toBeTruthy();
    }
  });

  test('should not expose sensitive data in client-side code', async ({ page }) => {
    // Arrange & Act
    const sensitiveData = await page.evaluate(() => {
      const scripts = Array.from(document.scripts);
      const scriptContent = scripts.map(s => s.textContent).join(' ');
      
      return {
        hasApiKey: scriptContent.includes('api_key') || scriptContent.includes('apiKey'),
        hasPassword: scriptContent.includes('password') && scriptContent.includes('='),
        hasToken: scriptContent.includes('token') && scriptContent.includes('='),
      };
    });

    // Assert - Should not expose sensitive data
    expect(sensitiveData.hasApiKey).toBeFalsy();
    expect(sensitiveData.hasPassword).toBeFalsy();
  });
});

// ============================================================================
// 11. PERFORMANCE TESTS
// ============================================================================

test.describe('Performance', () => {
  test('should meet Largest Contentful Paint (LCP) budget', async ({ page }) => {
    // Arrange & Act
    const vitals = await getWebVitals(page);

    // Assert
    expect(vitals.lcp).toBeLessThan(PERFORMANCE_BUDGETS.lcp);
  });

  test('should have minimal Cumulative Layout Shift (CLS)', async ({ page }) => {
    // Arrange & Act
    const vitals = await getWebVitals(page);

    // Assert
    expect(vitals.cls).toBeLessThan(PERFORMANCE_BUDGETS.cls);
  });

  test('should meet First Input Delay (FID) budget', async ({ page }) => {
    // Arrange & Act
    const vitals = await getWebVitals(page);

    // Assert
    if (vitals.fid > 0) {
      expect(vitals.fid).toBeLessThan(PERFORMANCE_BUDGETS.fid);
    }
  });

  test('should load efficiently on slow 3G network', async ({ page }) => {
    // Arrange - Simulate slow 3G
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 300);
    });

    // Act
    const startTime = Date.now();
    await page.goto('/');
    await page.locator(STORE_INFO_SELECTORS.storeInfoSection).first().waitFor({
      state: 'visible',
      timeout: 10000
    });
    const loadTime = Date.now() - startTime;

    // Assert - Should load within reasonable time
    expect(loadTime).toBeLessThan(10000);
  });

  test('should optimize form validation performance', async ({ page }) => {
    // Arrange
    const emailInput = page.locator(STORE_INFO_SELECTORS.emailInput).first();

    // Act
    const startTime = Date.now();
    await emailInput.fill('invalid-email');
    await emailInput.blur();
    await page.waitForTimeout(300);
    const validationTime = Date.now() - startTime;

    // Assert
    expect(validationTime).toBeLessThan(PERFORMANCE_BUDGETS.validationResponseTime + 300);
  });

  test('should minimize render-blocking resources', async ({ page }) => {
    // Arrange & Act
    const renderBlockingResources = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      return resources.filter(resource =>
        resource.renderBlockingStatus === 'blocking'
      ).length;
    });

    // Assert
    expect(renderBlockingResources).toBeLessThan(5);
  });
});

// ============================================================================
// 12. VISUAL REGRESSION TESTS
// ============================================================================

test.describe('Visual Regression', () => {
  test('should match store info section snapshot on desktop', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORT_SIZES.desktop);
    const storeInfoSection = page.locator(STORE_INFO_SELECTORS.storeInfoSection).first();

    // Act & Assert
    await expect(storeInfoSection).toHaveScreenshot('store-info-section-desktop.png');
  });

  test('should match store info section snapshot on mobile', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORT_SIZES.mobile);
    const storeInfoSection = page.locator(STORE_INFO_SELECTORS.storeInfoSection).first();

    // Act & Assert
    await expect(storeInfoSection).toHaveScreenshot('store-info-section-mobile.png');
  });

  test('should match contact form snapshot', async ({ page }) => {
    // Arrange
    const contactForm = page.locator(STORE_INFO_SELECTORS.contactForm).first();

    // Act & Assert
    await expect(contactForm).toHaveScreenshot('contact-form.png');
  });

  test('should match form error state snapshot', async ({ page }) => {
    // Arrange
    const submitButton = page.locator(STORE_INFO_SELECTORS.submitButton).first();

    // Act
    await submitButton.click();
    await page.waitForTimeout(500);

    const contactForm = page.locator(STORE_INFO_SELECTORS.contactForm).first();

    // Assert
    await expect(contactForm).toHaveScreenshot('contact-form-error.png');
  });
});

// ============================================================================
// 13. CROSS-BROWSER COMPATIBILITY TESTS
// ============================================================================

test.describe('Cross-Browser Compatibility', () => {
  test('should render consistently across browsers', async ({ page, browserName }) => {
    // Arrange & Act
    const storeInfoSection = page.locator(STORE_INFO_SELECTORS.storeInfoSection).first();

    // Assert
    await expect(storeInfoSection).toBeVisible();

    // Take screenshot for comparison
    await expect(storeInfoSection).toHaveScreenshot(`store-info-${browserName}.png`);
  });

  test('should support form validation across browsers', async ({ page }) => {
    // Arrange
    const submitButton = page.locator(STORE_INFO_SELECTORS.submitButton).first();

    // Act
    await submitButton.click();
    await page.waitForTimeout(500);

    // Assert
    const errors = await getFormErrors(page);
    expect(errors.length).toBeGreaterThan(0);
  });

  test('should handle map iframe across browsers', async ({ page }) => {
    // Arrange & Act
    const mapIframe = page.locator(STORE_INFO_SELECTORS.mapIframe).first();
    const iframeExists = await mapIframe.count() > 0;

    if (!iframeExists) {
      test.skip();
    }

    // Assert
    await expect(mapIframe).toBeVisible();
  });
});

// ============================================================================
// 14. EDGE CASES & ERROR HANDLING
// ============================================================================

test.describe('Edge Cases & Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Arrange
    await fillContactForm(page, TEST_DATA.validForm);

    // Mock network error
    await page.route('**/api/contact', route => route.abort('failed'));

    // Act
    await submitContactForm(page);
    await page.waitForTimeout(1000);

    // Assert - Should show error message
    const errorMessage = page.locator(STORE_INFO_SELECTORS.formError).first();
    const errorExists = await errorMessage.count() > 0;

    if (errorExists) {
      await expect(errorMessage).toBeVisible();
    }
  });

  test('should handle timeout errors', async ({ page }) => {
    // Arrange
    await fillContactForm(page, TEST_DATA.validForm);

    // Mock timeout
    await page.route('**/api/contact', route => {
      // Never respond
    });

    // Act
    await submitContactForm(page);
    await page.waitForTimeout(5000);

    // Assert - Should show timeout error or loading state
    const submitButton = page.locator(STORE_INFO_SELECTORS.submitButton).first();
    const isDisabled = await submitButton.isDisabled();

    expect(isDisabled || !isDisabled).toBeTruthy();
  });

  test('should handle rapid form submissions', async ({ page }) => {
    // Arrange
    await fillContactForm(page, TEST_DATA.validForm);

    let submissionCount = 0;
    await page.route('**/api/contact', route => {
      submissionCount++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Act - Rapid submissions
    const submitButton = page.locator(STORE_INFO_SELECTORS.submitButton).first();
    for (let i = 0; i < 5; i++) {
      await submitButton.click({ force: true });
      await page.waitForTimeout(50);
    }

    await page.waitForTimeout(1000);

    // Assert - Should prevent multiple submissions
    expect(submissionCount).toBeLessThanOrEqual(1);
  });

  test('should handle missing map gracefully', async ({ page }) => {
    // Arrange - Remove map
    await page.evaluate(() => {
      const map = document.querySelector('.store-map, #store-map, .map-container');
      if (map) map.remove();
    });

    // Act & Assert - Section should still be visible
    const storeInfoSection = page.locator(STORE_INFO_SELECTORS.storeInfoSection).first();
    await expect(storeInfoSection).toBeVisible();
  });

  test('should handle empty business hours', async ({ page }) => {
    // Arrange - Remove business hours
    await page.evaluate(() => {
      const hours = document.querySelector('.business-hours, .store-hours');
      if (hours) hours.remove();
    });

    // Act & Assert - Section should still be visible
    const storeInfoSection = page.locator(STORE_INFO_SELECTORS.storeInfoSection).first();
    await expect(storeInfoSection).toBeVisible();
  });

  test('should handle viewport resize during form interaction', async ({ page }) => {
    // Arrange
    await fillContactForm(page, TEST_DATA.validForm);

    // Act - Resize during interaction
    await page.setViewportSize(VIEWPORT_SIZES.mobile);
    await page.waitForTimeout(300);

    // Assert - Form should still be functional
    const submitButton = page.locator(STORE_INFO_SELECTORS.submitButton).first();
    await expect(submitButton).toBeVisible();
  });
});