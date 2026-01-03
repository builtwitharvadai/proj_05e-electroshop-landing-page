// tests/visual/responsive.test.js
import { test, expect } from '@playwright/test';

/**
 * Visual Regression Test Suite - Store Info Section Responsive Design
 * 
 * This suite captures screenshots across multiple viewports and browsers
 * to detect visual regressions in the store information section.
 * 
 * Test Coverage:
 * - Multiple viewport sizes (mobile, tablet, desktop)
 * - Cross-browser compatibility (Chromium, Firefox, WebKit)
 * - Component-level visual testing
 * - Layout consistency validation
 * - Responsive design verification
 * - Dark mode support (if applicable)
 * - Print styles validation
 * - Accessibility overlays
 * - Animation states
 * - Interactive element states (hover, focus, active)
 * 
 * Screenshot Strategy:
 * - Full page screenshots for context
 * - Component-level screenshots for precision
 * - Multiple viewport sizes for responsive testing
 * - Browser-specific screenshots for compatibility
 * - State-based screenshots (default, hover, focus, error)
 * 
 * Performance Considerations:
 * - Parallel test execution
 * - Screenshot optimization
 * - Selective screenshot capture
 * - Baseline management
 */

// ============================================================================
// TEST CONFIGURATION & CONSTANTS
// ============================================================================

/**
 * Viewport configurations for responsive testing
 * Covers common device sizes and breakpoints
 */
const VIEWPORTS = {
  // Mobile devices
  mobileTiny: { width: 320, height: 568, name: 'iPhone SE' },
  mobileSmall: { width: 375, height: 667, name: 'iPhone 8' },
  mobileMedium: { width: 390, height: 844, name: 'iPhone 12' },
  mobileLarge: { width: 414, height: 896, name: 'iPhone 11 Pro Max' },
  
  // Tablets
  tabletPortrait: { width: 768, height: 1024, name: 'iPad Portrait' },
  tabletLandscape: { width: 1024, height: 768, name: 'iPad Landscape' },
  tabletProPortrait: { width: 834, height: 1194, name: 'iPad Pro 11" Portrait' },
  tabletProLandscape: { width: 1194, height: 834, name: 'iPad Pro 11" Landscape' },
  
  // Desktop
  desktopSmall: { width: 1280, height: 800, name: 'Desktop Small' },
  desktopMedium: { width: 1440, height: 900, name: 'Desktop Medium' },
  desktopLarge: { width: 1920, height: 1080, name: 'Desktop Large' },
  desktopXL: { width: 2560, height: 1440, name: 'Desktop XL' },
  desktop4K: { width: 3840, height: 2160, name: 'Desktop 4K' },
};

/**
 * Selectors for store info section components
 */
const SELECTORS = {
  storeInfoSection: '[data-testid="store-info-section"], section.store-info, .store-info-section',
  storeInfoHeading: '.store-info-heading, .section-heading, h2',
  contactForm: '[data-testid="contact-form"], form.contact-form, .contact-form',
  mapContainer: '[data-testid="store-map"], .store-map, #store-map, .map-container',
  businessHours: '[data-testid="business-hours"], .business-hours, .store-hours',
  contactInfo: '[data-testid="contact-info"], .contact-info, .store-contact',
  nameInput: 'input[name="name"], input[id="name"], #contact-name',
  emailInput: 'input[name="email"], input[id="email"], #contact-email',
  phoneInput: 'input[name="phone"], input[id="phone"], #contact-phone',
  messageTextarea: 'textarea[name="message"], textarea[id="message"], #contact-message',
  submitButton: 'button[type="submit"], .submit-button, .contact-submit',
  fieldError: '.field-error, .input-error, .error-text',
};

/**
 * Screenshot options for consistent capture
 */
const SCREENSHOT_OPTIONS = {
  fullPage: {
    fullPage: true,
    animations: 'disabled',
    timeout: 10000,
  },
  component: {
    fullPage: false,
    animations: 'disabled',
    timeout: 5000,
  },
  withAnimations: {
    fullPage: false,
    animations: 'allow',
    timeout: 5000,
  },
};

/**
 * Test data for form states
 */
const TEST_DATA = {
  validForm: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    message: 'This is a test message for visual regression testing.',
  },
  invalidEmail: {
    name: 'Jane Smith',
    email: 'invalid-email',
    phone: '+1 (555) 987-6543',
    message: 'Testing error state.',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Wait for all images to load
 * Ensures screenshots capture fully loaded content
 */
async function waitForImages(page) {
  await page.evaluate(() => {
    return Promise.all(
      Array.from(document.images)
        .filter(img => !img.complete)
        .map(img => new Promise(resolve => {
          img.addEventListener('load', resolve);
          img.addEventListener('error', resolve);
        }))
    );
  });
}

/**
 * Wait for fonts to load
 * Prevents font-loading flicker in screenshots
 */
async function waitForFonts(page) {
  await page.evaluate(() => document.fonts.ready);
}

/**
 * Disable animations for consistent screenshots
 */
async function disableAnimations(page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  });
}

/**
 * Hide dynamic content that changes between test runs
 */
async function hideDynamicContent(page) {
  await page.addStyleTag({
    content: `
      .timestamp, .current-time, .live-indicator {
        visibility: hidden !important;
      }
    `,
  });
}

/**
 * Scroll to element and wait for stability
 */
async function scrollToElement(page, selector) {
  const element = page.locator(selector).first();
  await element.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300); // Wait for scroll to complete
}

/**
 * Fill contact form with test data
 */
async function fillContactForm(page, formData) {
  const nameInput = page.locator(SELECTORS.nameInput).first();
  const emailInput = page.locator(SELECTORS.emailInput).first();
  const phoneInput = page.locator(SELECTORS.phoneInput).first();
  const messageTextarea = page.locator(SELECTORS.messageTextarea).first();

  if (await nameInput.count() > 0) {
    await nameInput.fill(formData.name);
  }
  
  if (await emailInput.count() > 0) {
    await emailInput.fill(formData.email);
  }
  
  if (await phoneInput.count() > 0 && formData.phone) {
    await phoneInput.fill(formData.phone);
  }
  
  if (await messageTextarea.count() > 0) {
    await messageTextarea.fill(formData.message);
  }
}

/**
 * Prepare page for screenshot capture
 */
async function preparePageForScreenshot(page) {
  await waitForImages(page);
  await waitForFonts(page);
  await disableAnimations(page);
  await hideDynamicContent(page);
  await page.waitForTimeout(500); // Final stabilization
}

/**
 * Take screenshot with retry logic
 */
async function takeScreenshotWithRetry(locator, name, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await expect(locator).toHaveScreenshot(name, options);
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await locator.page().waitForTimeout(1000);
    }
  }
}

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

test.beforeEach(async ({ page }) => {
  // Navigate to home page
  await page.goto('/', { waitUntil: 'networkidle' });
  
  // Wait for store info section to be visible
  const storeInfoSection = page.locator(SELECTORS.storeInfoSection).first();
  await storeInfoSection.waitFor({ state: 'visible', timeout: 10000 });
  
  // Scroll to store info section
  await scrollToElement(page, SELECTORS.storeInfoSection);
  
  // Prepare page for screenshot
  await preparePageForScreenshot(page);
});

test.afterEach(async ({ page }) => {
  // Clean up any modals or overlays
  await page.evaluate(() => {
    document.querySelectorAll('[role="dialog"], .modal, .overlay').forEach(el => el.remove());
  });
});

// ============================================================================
// 1. FULL PAGE RESPONSIVE SCREENSHOTS
// ============================================================================

test.describe('Full Page Responsive Screenshots', () => {
  test('should capture full page at mobile tiny viewport (320px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.mobileTiny);
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);

    // Act & Assert
    await expect(page).toHaveScreenshot(
      'full-page-mobile-tiny-320px.png',
      SCREENSHOT_OPTIONS.fullPage
    );
  });

  test('should capture full page at mobile small viewport (375px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.mobileSmall);
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);

    // Act & Assert
    await expect(page).toHaveScreenshot(
      'full-page-mobile-small-375px.png',
      SCREENSHOT_OPTIONS.fullPage
    );
  });

  test('should capture full page at mobile medium viewport (390px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.mobileMedium);
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);

    // Act & Assert
    await expect(page).toHaveScreenshot(
      'full-page-mobile-medium-390px.png',
      SCREENSHOT_OPTIONS.fullPage
    );
  });

  test('should capture full page at mobile large viewport (414px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.mobileLarge);
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);

    // Act & Assert
    await expect(page).toHaveScreenshot(
      'full-page-mobile-large-414px.png',
      SCREENSHOT_OPTIONS.fullPage
    );
  });

  test('should capture full page at tablet portrait viewport (768px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.tabletPortrait);
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);

    // Act & Assert
    await expect(page).toHaveScreenshot(
      'full-page-tablet-portrait-768px.png',
      SCREENSHOT_OPTIONS.fullPage
    );
  });

  test('should capture full page at tablet landscape viewport (1024px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.tabletLandscape);
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);

    // Act & Assert
    await expect(page).toHaveScreenshot(
      'full-page-tablet-landscape-1024px.png',
      SCREENSHOT_OPTIONS.fullPage
    );
  });

  test('should capture full page at desktop small viewport (1280px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.desktopSmall);
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);

    // Act & Assert
    await expect(page).toHaveScreenshot(
      'full-page-desktop-small-1280px.png',
      SCREENSHOT_OPTIONS.fullPage
    );
  });

  test('should capture full page at desktop medium viewport (1440px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.desktopMedium);
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);

    // Act & Assert
    await expect(page).toHaveScreenshot(
      'full-page-desktop-medium-1440px.png',
      SCREENSHOT_OPTIONS.fullPage
    );
  });

  test('should capture full page at desktop large viewport (1920px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.desktopLarge);
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);

    // Act & Assert
    await expect(page).toHaveScreenshot(
      'full-page-desktop-large-1920px.png',
      SCREENSHOT_OPTIONS.fullPage
    );
  });

  test('should capture full page at desktop XL viewport (2560px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.desktopXL);
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);

    // Act & Assert
    await expect(page).toHaveScreenshot(
      'full-page-desktop-xl-2560px.png',
      SCREENSHOT_OPTIONS.fullPage
    );
  });
});

// ============================================================================
// 2. STORE INFO SECTION COMPONENT SCREENSHOTS
// ============================================================================

test.describe('Store Info Section Component Screenshots', () => {
  test('should capture store info section at mobile viewport (320px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.mobileTiny);
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);
    const storeInfoSection = page.locator(SELECTORS.storeInfoSection).first();

    // Act & Assert
    await expect(storeInfoSection).toHaveScreenshot(
      'store-info-section-mobile-320px.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture store info section at tablet viewport (768px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.tabletPortrait);
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);
    const storeInfoSection = page.locator(SELECTORS.storeInfoSection).first();

    // Act & Assert
    await expect(storeInfoSection).toHaveScreenshot(
      'store-info-section-tablet-768px.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture store info section at desktop viewport (1920px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.desktopLarge);
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);
    const storeInfoSection = page.locator(SELECTORS.storeInfoSection).first();

    // Act & Assert
    await expect(storeInfoSection).toHaveScreenshot(
      'store-info-section-desktop-1920px.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture store info heading across viewports', async ({ page }) => {
    // Arrange
    const heading = page.locator(SELECTORS.storeInfoHeading).first();
    const viewports = [
      { size: VIEWPORTS.mobileTiny, name: 'mobile-320px' },
      { size: VIEWPORTS.tabletPortrait, name: 'tablet-768px' },
      { size: VIEWPORTS.desktopLarge, name: 'desktop-1920px' },
    ];

    for (const viewport of viewports) {
      // Act
      await page.setViewportSize(viewport.size);
      await page.waitForTimeout(500);
      await preparePageForScreenshot(page);

      // Assert
      await expect(heading).toHaveScreenshot(
        `store-info-heading-${viewport.name}.png`,
        SCREENSHOT_OPTIONS.component
      );
    }
  });
});

// ============================================================================
// 3. CONTACT FORM COMPONENT SCREENSHOTS
// ============================================================================

test.describe('Contact Form Component Screenshots', () => {
  test('should capture contact form default state at mobile (320px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.mobileTiny);
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);
    const contactForm = page.locator(SELECTORS.contactForm).first();

    // Act & Assert
    await expect(contactForm).toHaveScreenshot(
      'contact-form-default-mobile-320px.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture contact form default state at tablet (768px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.tabletPortrait);
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);
    const contactForm = page.locator(SELECTORS.contactForm).first();

    // Act & Assert
    await expect(contactForm).toHaveScreenshot(
      'contact-form-default-tablet-768px.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture contact form default state at desktop (1920px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.desktopLarge);
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);
    const contactForm = page.locator(SELECTORS.contactForm).first();

    // Act & Assert
    await expect(contactForm).toHaveScreenshot(
      'contact-form-default-desktop-1920px.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture contact form filled state at mobile (320px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.mobileTiny);
    await page.waitForTimeout(500);
    await fillContactForm(page, TEST_DATA.validForm);
    await preparePageForScreenshot(page);
    const contactForm = page.locator(SELECTORS.contactForm).first();

    // Act & Assert
    await expect(contactForm).toHaveScreenshot(
      'contact-form-filled-mobile-320px.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture contact form filled state at tablet (768px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.tabletPortrait);
    await page.waitForTimeout(500);
    await fillContactForm(page, TEST_DATA.validForm);
    await preparePageForScreenshot(page);
    const contactForm = page.locator(SELECTORS.contactForm).first();

    // Act & Assert
    await expect(contactForm).toHaveScreenshot(
      'contact-form-filled-tablet-768px.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture contact form filled state at desktop (1920px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.desktopLarge);
    await page.waitForTimeout(500);
    await fillContactForm(page, TEST_DATA.validForm);
    await preparePageForScreenshot(page);
    const contactForm = page.locator(SELECTORS.contactForm).first();

    // Act & Assert
    await expect(contactForm).toHaveScreenshot(
      'contact-form-filled-desktop-1920px.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture contact form error state at mobile (320px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.mobileTiny);
    await page.waitForTimeout(500);
    await fillContactForm(page, TEST_DATA.invalidEmail);
    
    // Trigger validation
    const submitButton = page.locator(SELECTORS.submitButton).first();
    await submitButton.click();
    await page.waitForTimeout(500);
    
    await preparePageForScreenshot(page);
    const contactForm = page.locator(SELECTORS.contactForm).first();

    // Act & Assert
    await expect(contactForm).toHaveScreenshot(
      'contact-form-error-mobile-320px.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture contact form error state at tablet (768px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.tabletPortrait);
    await page.waitForTimeout(500);
    await fillContactForm(page, TEST_DATA.invalidEmail);
    
    // Trigger validation
    const submitButton = page.locator(SELECTORS.submitButton).first();
    await submitButton.click();
    await page.waitForTimeout(500);
    
    await preparePageForScreenshot(page);
    const contactForm = page.locator(SELECTORS.contactForm).first();

    // Act & Assert
    await expect(contactForm).toHaveScreenshot(
      'contact-form-error-tablet-768px.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture contact form error state at desktop (1920px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.desktopLarge);
    await page.waitForTimeout(500);
    await fillContactForm(page, TEST_DATA.invalidEmail);
    
    // Trigger validation
    const submitButton = page.locator(SELECTORS.submitButton).first();
    await submitButton.click();
    await page.waitForTimeout(500);
    
    await preparePageForScreenshot(page);
    const contactForm = page.locator(SELECTORS.contactForm).first();

    // Act & Assert
    await expect(contactForm).toHaveScreenshot(
      'contact-form-error-desktop-1920px.png',
      SCREENSHOT_OPTIONS.component
    );
  });
});

// ============================================================================
// 4. FORM INPUT FOCUS STATES
// ============================================================================

test.describe('Form Input Focus States', () => {
  test('should capture name input focus state at mobile (320px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.mobileTiny);
    await page.waitForTimeout(500);
    const nameInput = page.locator(SELECTORS.nameInput).first();
    await nameInput.focus();
    await page.waitForTimeout(300);
    await preparePageForScreenshot(page);
    const contactForm = page.locator(SELECTORS.contactForm).first();

    // Act & Assert
    await expect(contactForm).toHaveScreenshot(
      'form-name-input-focus-mobile-320px.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture email input focus state at tablet (768px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.tabletPortrait);
    await page.waitForTimeout(500);
    const emailInput = page.locator(SELECTORS.emailInput).first();
    await emailInput.focus();
    await page.waitForTimeout(300);
    await preparePageForScreenshot(page);
    const contactForm = page.locator(SELECTORS.contactForm).first();

    // Act & Assert
    await expect(contactForm).toHaveScreenshot(
      'form-email-input-focus-tablet-768px.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture message textarea focus state at desktop (1920px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.desktopLarge);
    await page.waitForTimeout(500);
    const messageTextarea = page.locator(SELECTORS.messageTextarea).first();
    await messageTextarea.focus();
    await page.waitForTimeout(300);
    await preparePageForScreenshot(page);
    const contactForm = page.locator(SELECTORS.contactForm).first();

    // Act & Assert
    await expect(contactForm).toHaveScreenshot(
      'form-message-textarea-focus-desktop-1920px.png',
      SCREENSHOT_OPTIONS.component
    );
  });
});

// ============================================================================
// 5. BUTTON STATES
// ============================================================================

test.describe('Button States', () => {
  test('should capture submit button default state at mobile (320px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.mobileTiny);
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);
    const submitButton = page.locator(SELECTORS.submitButton).first();

    // Act & Assert
    await expect(submitButton).toHaveScreenshot(
      'submit-button-default-mobile-320px.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture submit button hover state at desktop (1920px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.desktopLarge);
    await page.waitForTimeout(500);
    const submitButton = page.locator(SELECTORS.submitButton).first();
    await submitButton.hover();
    await page.waitForTimeout(300);
    await preparePageForScreenshot(page);

    // Act & Assert
    await expect(submitButton).toHaveScreenshot(
      'submit-button-hover-desktop-1920px.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture submit button focus state at tablet (768px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.tabletPortrait);
    await page.waitForTimeout(500);
    const submitButton = page.locator(SELECTORS.submitButton).first();
    await submitButton.focus();
    await page.waitForTimeout(300);
    await preparePageForScreenshot(page);

    // Act & Assert
    await expect(submitButton).toHaveScreenshot(
      'submit-button-focus-tablet-768px.png',
      SCREENSHOT_OPTIONS.component
    );
  });
});

// ============================================================================
// 6. MAP COMPONENT SCREENSHOTS
// ============================================================================

test.describe('Map Component Screenshots', () => {
  test('should capture map container at mobile (320px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.mobileTiny);
    await page.waitForTimeout(500);
    const mapContainer = page.locator(SELECTORS.mapContainer).first();
    const mapExists = await mapContainer.count() > 0;

    if (!mapExists) {
      test.skip();
    }

    await preparePageForScreenshot(page);

    // Act & Assert
    await expect(mapContainer).toHaveScreenshot(
      'map-container-mobile-320px.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture map container at tablet (768px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.tabletPortrait);
    await page.waitForTimeout(500);
    const mapContainer = page.locator(SELECTORS.mapContainer).first();
    const mapExists = await mapContainer.count() > 0;

    if (!mapExists) {
      test.skip();
    }

    await preparePageForScreenshot(page);

    // Act & Assert
    await expect(mapContainer).toHaveScreenshot(
      'map-container-tablet-768px.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture map container at desktop (1920px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.desktopLarge);
    await page.waitForTimeout(500);
    const mapContainer = page.locator(SELECTORS.mapContainer).first();
    const mapExists = await mapContainer.count() > 0;

    if (!mapExists) {
      test.skip();
    }

    await preparePageForScreenshot(page);

    // Act & Assert
    await expect(mapContainer).toHaveScreenshot(
      'map-container-desktop-1920px.png',
      SCREENSHOT_OPTIONS.component
    );
  });
});

// ============================================================================
// 7. BUSINESS HOURS COMPONENT SCREENSHOTS
// ============================================================================

test.describe('Business Hours Component Screenshots', () => {
  test('should capture business hours at mobile (320px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.mobileTiny);
    await page.waitForTimeout(500);
    const businessHours = page.locator(SELECTORS.businessHours).first();
    const hoursExists = await businessHours.count() > 0;

    if (!hoursExists) {
      test.skip();
    }

    await preparePageForScreenshot(page);

    // Act & Assert
    await expect(businessHours).toHaveScreenshot(
      'business-hours-mobile-320px.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture business hours at tablet (768px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.tabletPortrait);
    await page.waitForTimeout(500);
    const businessHours = page.locator(SELECTORS.businessHours).first();
    const hoursExists = await businessHours.count() > 0;

    if (!hoursExists) {
      test.skip();
    }

    await preparePageForScreenshot(page);

    // Act & Assert
    await expect(businessHours).toHaveScreenshot(
      'business-hours-tablet-768px.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture business hours at desktop (1920px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.desktopLarge);
    await page.waitForTimeout(500);
    const businessHours = page.locator(SELECTORS.businessHours).first();
    const hoursExists = await businessHours.count() > 0;

    if (!hoursExists) {
      test.skip();
    }

    await preparePageForScreenshot(page);

    // Act & Assert
    await expect(businessHours).toHaveScreenshot(
      'business-hours-desktop-1920px.png',
      SCREENSHOT_OPTIONS.component
    );
  });
});

// ============================================================================
// 8. CONTACT INFORMATION COMPONENT SCREENSHOTS
// ============================================================================

test.describe('Contact Information Component Screenshots', () => {
  test('should capture contact info at mobile (320px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.mobileTiny);
    await page.waitForTimeout(500);
    const contactInfo = page.locator(SELECTORS.contactInfo).first();
    const infoExists = await contactInfo.count() > 0;

    if (!infoExists) {
      test.skip();
    }

    await preparePageForScreenshot(page);

    // Act & Assert
    await expect(contactInfo).toHaveScreenshot(
      'contact-info-mobile-320px.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture contact info at tablet (768px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.tabletPortrait);
    await page.waitForTimeout(500);
    const contactInfo = page.locator(SELECTORS.contactInfo).first();
    const infoExists = await contactInfo.count() > 0;

    if (!infoExists) {
      test.skip();
    }

    await preparePageForScreenshot(page);

    // Act & Assert
    await expect(contactInfo).toHaveScreenshot(
      'contact-info-tablet-768px.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture contact info at desktop (1920px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.desktopLarge);
    await page.waitForTimeout(500);
    const contactInfo = page.locator(SELECTORS.contactInfo).first();
    const infoExists = await contactInfo.count() > 0;

    if (!infoExists) {
      test.skip();
    }

    await preparePageForScreenshot(page);

    // Act & Assert
    await expect(contactInfo).toHaveScreenshot(
      'contact-info-desktop-1920px.png',
      SCREENSHOT_OPTIONS.component
    );
  });
});

// ============================================================================
// 9. CROSS-BROWSER VISUAL REGRESSION
// ============================================================================

test.describe('Cross-Browser Visual Regression', () => {
  test('should match baseline across browsers at mobile (320px)', async ({ page, browserName }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.mobileTiny);
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);
    const storeInfoSection = page.locator(SELECTORS.storeInfoSection).first();

    // Act & Assert
    await expect(storeInfoSection).toHaveScreenshot(
      `store-info-section-${browserName}-mobile-320px.png`,
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should match baseline across browsers at tablet (768px)', async ({ page, browserName }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.tabletPortrait);
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);
    const storeInfoSection = page.locator(SELECTORS.storeInfoSection).first();

    // Act & Assert
    await expect(storeInfoSection).toHaveScreenshot(
      `store-info-section-${browserName}-tablet-768px.png`,
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should match baseline across browsers at desktop (1920px)', async ({ page, browserName }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.desktopLarge);
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);
    const storeInfoSection = page.locator(SELECTORS.storeInfoSection).first();

    // Act & Assert
    await expect(storeInfoSection).toHaveScreenshot(
      `store-info-section-${browserName}-desktop-1920px.png`,
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should match contact form across browsers at mobile (320px)', async ({ page, browserName }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.mobileTiny);
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);
    const contactForm = page.locator(SELECTORS.contactForm).first();

    // Act & Assert
    await expect(contactForm).toHaveScreenshot(
      `contact-form-${browserName}-mobile-320px.png`,
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should match contact form across browsers at desktop (1920px)', async ({ page, browserName }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.desktopLarge);
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);
    const contactForm = page.locator(SELECTORS.contactForm).first();

    // Act & Assert
    await expect(contactForm).toHaveScreenshot(
      `contact-form-${browserName}-desktop-1920px.png`,
      SCREENSHOT_OPTIONS.component
    );
  });
});

// ============================================================================
// 10. LAYOUT BREAKPOINT TRANSITIONS
// ============================================================================

test.describe('Layout Breakpoint Transitions', () => {
  test('should capture layout at common breakpoints', async ({ page }) => {
    // Arrange
    const breakpoints = [
      { width: 320, name: 'xs' },
      { width: 480, name: 'sm' },
      { width: 768, name: 'md' },
      { width: 1024, name: 'lg' },
      { width: 1280, name: 'xl' },
      { width: 1920, name: 'xxl' },
    ];

    for (const breakpoint of breakpoints) {
      // Act
      await page.setViewportSize({ width: breakpoint.width, height: 800 });
      await page.waitForTimeout(500);
      await preparePageForScreenshot(page);
      const storeInfoSection = page.locator(SELECTORS.storeInfoSection).first();

      // Assert
      await expect(storeInfoSection).toHaveScreenshot(
        `store-info-breakpoint-${breakpoint.name}-${breakpoint.width}px.png`,
        SCREENSHOT_OPTIONS.component
      );
    }
  });

  test('should capture form layout transitions', async ({ page }) => {
    // Arrange
    const breakpoints = [
      { width: 320, name: 'mobile' },
      { width: 768, name: 'tablet' },
      { width: 1280, name: 'desktop' },
    ];

    for (const breakpoint of breakpoints) {
      // Act
      await page.setViewportSize({ width: breakpoint.width, height: 800 });
      await page.waitForTimeout(500);
      await fillContactForm(page, TEST_DATA.validForm);
      await preparePageForScreenshot(page);
      const contactForm = page.locator(SELECTORS.contactForm).first();

      // Assert
      await expect(contactForm).toHaveScreenshot(
        `contact-form-layout-${breakpoint.name}-${breakpoint.width}px.png`,
        SCREENSHOT_OPTIONS.component
      );
    }
  });
});

// ============================================================================
// 11. ORIENTATION CHANGES
// ============================================================================

test.describe('Orientation Changes', () => {
  test('should capture tablet portrait orientation', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.tabletPortrait);
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);
    const storeInfoSection = page.locator(SELECTORS.storeInfoSection).first();

    // Act & Assert
    await expect(storeInfoSection).toHaveScreenshot(
      'store-info-tablet-portrait.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture tablet landscape orientation', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.tabletLandscape);
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);
    const storeInfoSection = page.locator(SELECTORS.storeInfoSection).first();

    // Act & Assert
    await expect(storeInfoSection).toHaveScreenshot(
      'store-info-tablet-landscape.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture iPad Pro portrait orientation', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.tabletProPortrait);
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);
    const storeInfoSection = page.locator(SELECTORS.storeInfoSection).first();

    // Act & Assert
    await expect(storeInfoSection).toHaveScreenshot(
      'store-info-ipad-pro-portrait.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture iPad Pro landscape orientation', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.tabletProLandscape);
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);
    const storeInfoSection = page.locator(SELECTORS.storeInfoSection).first();

    // Act & Assert
    await expect(storeInfoSection).toHaveScreenshot(
      'store-info-ipad-pro-landscape.png',
      SCREENSHOT_OPTIONS.component
    );
  });
});

// ============================================================================
// 12. PRINT STYLES
// ============================================================================

test.describe('Print Styles', () => {
  test('should capture print preview at desktop (1920px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.desktopLarge);
    await page.waitForTimeout(500);
    
    // Emulate print media
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(500);
    
    await preparePageForScreenshot(page);
    const storeInfoSection = page.locator(SELECTORS.storeInfoSection).first();

    // Act & Assert
    await expect(storeInfoSection).toHaveScreenshot(
      'store-info-print-preview-desktop-1920px.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture contact form print preview', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.desktopLarge);
    await page.waitForTimeout(500);
    await fillContactForm(page, TEST_DATA.validForm);
    
    // Emulate print media
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(500);
    
    await preparePageForScreenshot(page);
    const contactForm = page.locator(SELECTORS.contactForm).first();

    // Act & Assert
    await expect(contactForm).toHaveScreenshot(
      'contact-form-print-preview.png',
      SCREENSHOT_OPTIONS.component
    );
  });
});

// ============================================================================
// 13. DARK MODE (IF SUPPORTED)
// ============================================================================

test.describe('Dark Mode Visual Regression', () => {
  test('should capture dark mode at mobile (320px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.mobileTiny);
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);
    const storeInfoSection = page.locator(SELECTORS.storeInfoSection).first();

    // Act & Assert
    await expect(storeInfoSection).toHaveScreenshot(
      'store-info-dark-mode-mobile-320px.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture dark mode at tablet (768px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.tabletPortrait);
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);
    const storeInfoSection = page.locator(SELECTORS.storeInfoSection).first();

    // Act & Assert
    await expect(storeInfoSection).toHaveScreenshot(
      'store-info-dark-mode-tablet-768px.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture dark mode at desktop (1920px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.desktopLarge);
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);
    const storeInfoSection = page.locator(SELECTORS.storeInfoSection).first();

    // Act & Assert
    await expect(storeInfoSection).toHaveScreenshot(
      'store-info-dark-mode-desktop-1920px.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture contact form dark mode', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.desktopLarge);
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);
    const contactForm = page.locator(SELECTORS.contactForm).first();

    // Act & Assert
    await expect(contactForm).toHaveScreenshot(
      'contact-form-dark-mode-desktop-1920px.png',
      SCREENSHOT_OPTIONS.component
    );
  });
});

// ============================================================================
// 14. HIGH CONTRAST MODE
// ============================================================================

test.describe('High Contrast Mode', () => {
  test('should capture high contrast mode at desktop (1920px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.desktopLarge);
    await page.emulateMedia({ forcedColors: 'active' });
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);
    const storeInfoSection = page.locator(SELECTORS.storeInfoSection).first();

    // Act & Assert
    await expect(storeInfoSection).toHaveScreenshot(
      'store-info-high-contrast-desktop-1920px.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture contact form high contrast mode', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.desktopLarge);
    await page.emulateMedia({ forcedColors: 'active' });
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);
    const contactForm = page.locator(SELECTORS.contactForm).first();

    // Act & Assert
    await expect(contactForm).toHaveScreenshot(
      'contact-form-high-contrast-desktop-1920px.png',
      SCREENSHOT_OPTIONS.component
    );
  });
});

// ============================================================================
// 15. REDUCED MOTION MODE
// ============================================================================

test.describe('Reduced Motion Mode', () => {
  test('should capture reduced motion mode at desktop (1920px)', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.desktopLarge);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(500);
    await preparePageForScreenshot(page);
    const storeInfoSection = page.locator(SELECTORS.storeInfoSection).first();

    // Act & Assert
    await expect(storeInfoSection).toHaveScreenshot(
      'store-info-reduced-motion-desktop-1920px.png',
      SCREENSHOT_OPTIONS.component
    );
  });
});

// ============================================================================
// 16. ZOOM LEVELS
// ============================================================================

test.describe('Zoom Levels', () => {
  test('should capture at 150% zoom level', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.desktopLarge);
    await page.waitForTimeout(500);
    
    // Set zoom level
    await page.evaluate(() => {
      document.body.style.zoom = '1.5';
    });
    await page.waitForTimeout(500);
    
    await preparePageForScreenshot(page);
    const storeInfoSection = page.locator(SELECTORS.storeInfoSection).first();

    // Act & Assert
    await expect(storeInfoSection).toHaveScreenshot(
      'store-info-zoom-150-desktop-1920px.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture at 200% zoom level', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.desktopLarge);
    await page.waitForTimeout(500);
    
    // Set zoom level
    await page.evaluate(() => {
      document.body.style.zoom = '2.0';
    });
    await page.waitForTimeout(500);
    
    await preparePageForScreenshot(page);
    const storeInfoSection = page.locator(SELECTORS.storeInfoSection).first();

    // Act & Assert
    await expect(storeInfoSection).toHaveScreenshot(
      'store-info-zoom-200-desktop-1920px.png',
      SCREENSHOT_OPTIONS.component
    );
  });
});

// ============================================================================
// 17. SCROLL POSITION SCREENSHOTS
// ============================================================================

test.describe('Scroll Position Screenshots', () => {
  test('should capture section at top of viewport', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.desktopLarge);
    await page.waitForTimeout(500);
    
    // Scroll to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    
    await preparePageForScreenshot(page);

    // Act & Assert
    await expect(page).toHaveScreenshot(
      'page-scroll-top-desktop-1920px.png',
      SCREENSHOT_OPTIONS.fullPage
    );
  });

  test('should capture section scrolled into view', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.desktopLarge);
    await page.waitForTimeout(500);
    
    const storeInfoSection = page.locator(SELECTORS.storeInfoSection).first();
    await storeInfoSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    
    await preparePageForScreenshot(page);

    // Act & Assert
    await expect(page).toHaveScreenshot(
      'page-scroll-section-desktop-1920px.png',
      SCREENSHOT_OPTIONS.fullPage
    );
  });
});

// ============================================================================
// 18. PERFORMANCE COMPARISON SCREENSHOTS
// ============================================================================

test.describe('Performance Comparison Screenshots', () => {
  test('should capture initial load state', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.desktopLarge);
    
    // Navigate without waiting for full load
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    
    const storeInfoSection = page.locator(SELECTORS.storeInfoSection).first();
    await storeInfoSection.waitFor({ state: 'visible', timeout: 5000 });

    // Act & Assert
    await expect(storeInfoSection).toHaveScreenshot(
      'store-info-initial-load-desktop-1920px.png',
      SCREENSHOT_OPTIONS.component
    );
  });

  test('should capture fully loaded state', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORTS.desktopLarge);
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    await preparePageForScreenshot(page);
    const storeInfoSection = page.locator(SELECTORS.storeInfoSection).first();

    // Act & Assert
    await expect(storeInfoSection).toHaveScreenshot(
      'store-info-fully-loaded-desktop-1920px.png',
      SCREENSHOT_OPTIONS.component
    );
  });
});