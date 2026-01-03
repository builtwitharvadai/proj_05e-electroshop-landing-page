// tests/accessibility/a11y.test.js
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility Test Suite - Store Info Section WCAG 2.1 AA Compliance
 * 
 * This suite validates accessibility compliance using axe-core for automated
 * testing and manual verification patterns for comprehensive coverage.
 * 
 * Test Coverage:
 * - WCAG 2.1 Level A compliance (required)
 * - WCAG 2.1 Level AA compliance (required)
 * - Keyboard navigation and focus management
 * - Screen reader compatibility (ARIA labels, roles, live regions)
 * - Color contrast ratios (4.5:1 for normal text, 3:1 for large text)
 * - Semantic HTML structure and landmarks
 * - Form accessibility (labels, error messages, validation)
 * - Interactive element accessibility (buttons, links, inputs)
 * - Focus indicators and visible focus states
 * - Alternative text for images and icons
 * - Heading hierarchy and document structure
 * - Skip links and navigation shortcuts
 * - Touch target sizes (minimum 44x44px)
 * - Text spacing and readability
 * - Responsive design accessibility
 * - Dark mode and high contrast support
 * - Reduced motion preferences
 * 
 * Axe-Core Rules Tested:
 * - aria-* attributes validity
 * - button-name (buttons have accessible names)
 * - color-contrast (sufficient contrast ratios)
 * - document-title (page has title)
 * - duplicate-id (no duplicate IDs)
 * - form-field-multiple-labels (no multiple labels)
 * - frame-title (iframes have titles)
 * - html-has-lang (HTML has lang attribute)
 * - image-alt (images have alt text)
 * - input-button-name (input buttons have names)
 * - label (form elements have labels)
 * - landmark-one-main (page has one main landmark)
 * - link-name (links have accessible names)
 * - list (lists are properly structured)
 * - listitem (list items are in lists)
 * - meta-viewport (viewport meta tag is valid)
 * - region (content is in landmarks)
 * - tabindex (no positive tabindex values)
 * 
 * Performance Considerations:
 * - Parallel test execution
 * - Selective axe-core rule execution
 * - Screenshot capture for violations
 * - Detailed violation reporting
 */

// ============================================================================
// TEST CONFIGURATION & CONSTANTS
// ============================================================================

/**
 * Viewport configurations for accessibility testing
 */
const VIEWPORTS = {
  mobile: { width: 375, height: 667, name: 'Mobile' },
  tablet: { width: 768, height: 1024, name: 'Tablet' },
  desktop: { width: 1920, height: 1080, name: 'Desktop' },
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
  skipLink: 'a[href="#main-content"], .skip-link, [data-testid="skip-link"]',
  mainLandmark: 'main, [role="main"]',
  navigationLandmark: 'nav, [role="navigation"]',
  formLandmark: 'form, [role="form"]',
};

/**
 * WCAG 2.1 AA color contrast requirements
 */
const CONTRAST_REQUIREMENTS = {
  normalText: 4.5,
  largeText: 3.0,
  uiComponents: 3.0,
};

/**
 * Minimum touch target size (WCAG 2.1 AA)
 */
const MIN_TOUCH_TARGET_SIZE = 44;

/**
 * Test data for form accessibility testing
 */
const TEST_DATA = {
  validForm: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    message: 'This is a test message for accessibility testing.',
  },
  invalidEmail: {
    name: 'Jane Smith',
    email: 'invalid-email',
    phone: '+1 (555) 987-6543',
    message: 'Testing error state accessibility.',
  },
};

/**
 * Axe-core configuration for comprehensive testing
 */
const AXE_CONFIG = {
  rules: {
    // Enable all WCAG 2.1 AA rules
    'color-contrast': { enabled: true },
    'aria-allowed-attr': { enabled: true },
    'aria-required-attr': { enabled: true },
    'aria-valid-attr': { enabled: true },
    'aria-valid-attr-value': { enabled: true },
    'button-name': { enabled: true },
    'document-title': { enabled: true },
    'duplicate-id': { enabled: true },
    'form-field-multiple-labels': { enabled: true },
    'frame-title': { enabled: true },
    'html-has-lang': { enabled: true },
    'image-alt': { enabled: true },
    'input-button-name': { enabled: true },
    'label': { enabled: true },
    'landmark-one-main': { enabled: true },
    'link-name': { enabled: true },
    'list': { enabled: true },
    'listitem': { enabled: true },
    'meta-viewport': { enabled: true },
    'region': { enabled: true },
    'tabindex': { enabled: true },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Run axe-core accessibility scan
 */
async function runAxeScan(page, context = null) {
  const axeBuilder = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .options(AXE_CONFIG);

  if (context) {
    axeBuilder.include(context);
  }

  return await axeBuilder.analyze();
}

/**
 * Format axe violations for detailed reporting
 */
function formatViolations(violations) {
  return violations.map(violation => ({
    id: violation.id,
    impact: violation.impact,
    description: violation.description,
    help: violation.help,
    helpUrl: violation.helpUrl,
    nodes: violation.nodes.map(node => ({
      html: node.html,
      target: node.target,
      failureSummary: node.failureSummary,
    })),
  }));
}

/**
 * Assert no accessibility violations
 */
async function assertNoViolations(page, context = null, testName = '') {
  const results = await runAxeScan(page, context);
  
  if (results.violations.length > 0) {
    const formattedViolations = formatViolations(results.violations);
    
    // Take screenshot of violations
    await page.screenshot({
      path: `test-results/a11y-violations-${testName}-${Date.now()}.png`,
      fullPage: true,
    });
    
    // Create detailed error message
    const errorMessage = `
Accessibility Violations Found (${results.violations.length}):

${formattedViolations.map((v, i) => `
${i + 1}. ${v.id} (${v.impact})
   Description: ${v.description}
   Help: ${v.help}
   Help URL: ${v.helpUrl}
   
   Affected Elements:
   ${v.nodes.map((n, j) => `
   ${j + 1}. Target: ${n.target.join(' > ')}
      HTML: ${n.html}
      Issue: ${n.failureSummary}
   `).join('\n')}
`).join('\n')}
    `.trim();
    
    throw new Error(errorMessage);
  }
  
  expect(results.violations).toHaveLength(0);
}

/**
 * Get computed color contrast ratio
 */
async function getContrastRatio(page, selector) {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return null;
    
    const style = window.getComputedStyle(element);
    const color = style.color;
    const backgroundColor = style.backgroundColor;
    
    // Parse RGB values
    const parseRGB = (rgb) => {
      const match = rgb.match(/\d+/g);
      return match ? match.map(Number) : null;
    };
    
    const foreground = parseRGB(color);
    const background = parseRGB(backgroundColor);
    
    if (!foreground || !background) return null;
    
    // Calculate relative luminance
    const getLuminance = (rgb) => {
      const [r, g, b] = rgb.map(val => {
        val = val / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    
    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }, selector);
}

/**
 * Get element dimensions for touch target validation
 */
async function getElementDimensions(page, selector) {
  const element = page.locator(selector).first();
  const box = await element.boundingBox();
  return box;
}

/**
 * Check if element is keyboard focusable
 */
async function isKeyboardFocusable(page, selector) {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;
    
    const tabindex = element.getAttribute('tabindex');
    const isNaturallyFocusable = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName);
    
    return isNaturallyFocusable || (tabindex !== null && parseInt(tabindex) >= 0);
  }, selector);
}

/**
 * Get ARIA attributes of element
 */
async function getAriaAttributes(page, selector) {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return null;
    
    const ariaAttrs = {};
    for (const attr of element.attributes) {
      if (attr.name.startsWith('aria-')) {
        ariaAttrs[attr.name] = attr.value;
      }
    }
    
    return ariaAttrs;
  }, selector);
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
 * Navigate using keyboard only
 */
async function navigateWithKeyboard(page, key, times = 1) {
  for (let i = 0; i < times; i++) {
    await page.keyboard.press(key);
    await page.waitForTimeout(100);
  }
}

/**
 * Get focus order of interactive elements
 */
async function getFocusOrder(page, containerSelector) {
  return await page.evaluate((container) => {
    const focusableElements = Array.from(
      document.querySelectorAll(
        `${container} a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])`
      )
    );
    
    return focusableElements.map((el, index) => ({
      index,
      tagName: el.tagName,
      id: el.id,
      className: el.className,
      tabindex: el.getAttribute('tabindex'),
      ariaLabel: el.getAttribute('aria-label'),
      text: el.textContent?.trim().substring(0, 50),
    }));
  }, containerSelector);
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
  await storeInfoSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
});

test.afterEach(async ({ page }) => {
  // Clean up any modals or overlays
  await page.evaluate(() => {
    document.querySelectorAll('[role="dialog"], .modal, .overlay').forEach(el => el.remove());
  });
});

// ============================================================================
// 1. FULL PAGE WCAG 2.1 AA COMPLIANCE
// ============================================================================

test.describe('Full Page WCAG 2.1 AA Compliance', () => {
  test('should pass axe-core accessibility scan on full page', async ({ page }) => {
    // Arrange & Act & Assert
    await assertNoViolations(page, null, 'full-page');
  });

  test('should have valid HTML lang attribute', async ({ page }) => {
    // Arrange & Act
    const htmlLang = await page.getAttribute('html', 'lang');

    // Assert
    expect(htmlLang).toBeTruthy();
    expect(htmlLang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/); // e.g., 'en' or 'en-US'
  });

  test('should have descriptive page title', async ({ page }) => {
    // Arrange & Act
    const title = await page.title();

    // Assert
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    expect(title.length).toBeLessThan(60); // SEO best practice
  });

  test('should have valid viewport meta tag', async ({ page }) => {
    // Arrange & Act
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');

    // Assert
    expect(viewport).toBeTruthy();
    expect(viewport).toContain('width=device-width');
    expect(viewport).not.toContain('user-scalable=no'); // Allow zoom for accessibility
  });

  test('should have no duplicate IDs', async ({ page }) => {
    // Arrange & Act
    const duplicateIds = await page.evaluate(() => {
      const ids = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
      return [...new Set(duplicates)];
    });

    // Assert
    expect(duplicateIds).toHaveLength(0);
  });
});

// ============================================================================
// 2. STORE INFO SECTION ACCESSIBILITY
// ============================================================================

test.describe('Store Info Section Accessibility', () => {
  test('should pass axe-core scan on store info section', async ({ page }) => {
    // Arrange
    const storeInfoSection = page.locator(SELECTORS.storeInfoSection).first();
    const sectionSelector = await storeInfoSection.evaluate(el => {
      return el.getAttribute('data-testid') || `.${el.className.split(' ')[0]}`;
    });

    // Act & Assert
    await assertNoViolations(page, sectionSelector, 'store-info-section');
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Arrange & Act
    const headings = await page.evaluate(() => {
      const headingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      return headingElements.map(h => ({
        level: parseInt(h.tagName.substring(1)),
        text: h.textContent?.trim(),
      }));
    });

    // Assert
    expect(headings.length).toBeGreaterThan(0);
    
    // Check for h1
    const h1Count = headings.filter(h => h.level === 1).length;
    expect(h1Count).toBe(1); // Exactly one h1
    
    // Check hierarchy (no skipped levels)
    for (let i = 1; i < headings.length; i++) {
      const diff = headings[i].level - headings[i - 1].level;
      expect(diff).toBeLessThanOrEqual(1); // No skipped levels
    }
  });

  test('should have main landmark', async ({ page }) => {
    // Arrange & Act
    const mainLandmark = page.locator(SELECTORS.mainLandmark).first();
    const mainExists = await mainLandmark.count() > 0;

    // Assert
    expect(mainExists).toBe(true);
  });

  test('should have proper landmark structure', async ({ page }) => {
    // Arrange & Act
    const landmarks = await page.evaluate(() => {
      const landmarkElements = Array.from(
        document.querySelectorAll('main, nav, aside, header, footer, [role="main"], [role="navigation"], [role="complementary"], [role="banner"], [role="contentinfo"]')
      );
      
      return landmarkElements.map(el => ({
        tagName: el.tagName,
        role: el.getAttribute('role'),
        ariaLabel: el.getAttribute('aria-label'),
      }));
    });

    // Assert
    expect(landmarks.length).toBeGreaterThan(0);
    
    // Check for main landmark
    const mainLandmarks = landmarks.filter(l => 
      l.tagName === 'MAIN' || l.role === 'main'
    );
    expect(mainLandmarks.length).toBe(1); // Exactly one main landmark
  });

  test('should have skip link for keyboard navigation', async ({ page }) => {
    // Arrange
    const skipLink = page.locator(SELECTORS.skipLink).first();
    
    // Act
    const skipLinkExists = await skipLink.count() > 0;
    
    if (skipLinkExists) {
      // Focus skip link
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.textContent?.trim());
      
      // Assert
      expect(focusedElement).toContain('Skip');
    } else {
      // Skip test if no skip link (not required but recommended)
      test.skip();
    }
  });
});

// ============================================================================
// 3. CONTACT FORM ACCESSIBILITY
// ============================================================================

test.describe('Contact Form Accessibility', () => {
  test('should pass axe-core scan on contact form', async ({ page }) => {
    // Arrange
    const contactForm = page.locator(SELECTORS.contactForm).first();
    const formSelector = await contactForm.evaluate(el => {
      return el.getAttribute('data-testid') || 'form';
    });

    // Act & Assert
    await assertNoViolations(page, formSelector, 'contact-form');
  });

  test('should have accessible form labels', async ({ page }) => {
    // Arrange
    const inputs = [
      SELECTORS.nameInput,
      SELECTORS.emailInput,
      SELECTORS.phoneInput,
      SELECTORS.messageTextarea,
    ];

    for (const inputSelector of inputs) {
      const input = page.locator(inputSelector).first();
      const inputExists = await input.count() > 0;
      
      if (!inputExists) continue;

      // Act
      const labelInfo = await input.evaluate(el => {
        const id = el.id;
        const name = el.name;
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledby = el.getAttribute('aria-labelledby');
        const label = id ? document.querySelector(`label[for="${id}"]`) : null;
        
        return {
          hasLabel: !!label,
          hasAriaLabel: !!ariaLabel,
          hasAriaLabelledby: !!ariaLabelledby,
          labelText: label?.textContent?.trim(),
          ariaLabel,
        };
      });

      // Assert
      const hasAccessibleLabel = 
        labelInfo.hasLabel || 
        labelInfo.hasAriaLabel || 
        labelInfo.hasAriaLabelledby;
      
      expect(hasAccessibleLabel).toBe(true);
      
      if (labelInfo.hasLabel) {
        expect(labelInfo.labelText).toBeTruthy();
        expect(labelInfo.labelText.length).toBeGreaterThan(0);
      }
    }
  });

  test('should have proper input types', async ({ page }) => {
    // Arrange & Act
    const emailInput = page.locator(SELECTORS.emailInput).first();
    const phoneInput = page.locator(SELECTORS.phoneInput).first();

    if (await emailInput.count() > 0) {
      const emailType = await emailInput.getAttribute('type');
      expect(emailType).toBe('email');
    }

    if (await phoneInput.count() > 0) {
      const phoneType = await phoneInput.getAttribute('type');
      expect(['tel', 'text']).toContain(phoneType);
    }
  });

  test('should have accessible submit button', async ({ page }) => {
    // Arrange
    const submitButton = page.locator(SELECTORS.submitButton).first();

    // Act
    const buttonInfo = await submitButton.evaluate(el => ({
      text: el.textContent?.trim(),
      ariaLabel: el.getAttribute('aria-label'),
      type: el.getAttribute('type'),
      disabled: el.disabled,
    }));

    // Assert
    expect(buttonInfo.type).toBe('submit');
    expect(buttonInfo.text || buttonInfo.ariaLabel).toBeTruthy();
  });

  test('should have accessible error messages', async ({ page }) => {
    // Arrange
    await fillContactForm(page, TEST_DATA.invalidEmail);
    const submitButton = page.locator(SELECTORS.submitButton).first();

    // Act
    await submitButton.click();
    await page.waitForTimeout(500);

    const errorMessages = page.locator(SELECTORS.fieldError);
    const errorCount = await errorMessages.count();

    if (errorCount > 0) {
      for (let i = 0; i < errorCount; i++) {
        const error = errorMessages.nth(i);
        
        // Assert
        const errorInfo = await error.evaluate(el => ({
          text: el.textContent?.trim(),
          role: el.getAttribute('role'),
          ariaLive: el.getAttribute('aria-live'),
          ariaAtomic: el.getAttribute('aria-atomic'),
        }));

        expect(errorInfo.text).toBeTruthy();
        expect(errorInfo.text.length).toBeGreaterThan(0);
        
        // Error should be announced to screen readers
        const isAccessible = 
          errorInfo.role === 'alert' || 
          errorInfo.ariaLive === 'polite' || 
          errorInfo.ariaLive === 'assertive';
        
        expect(isAccessible).toBe(true);
      }
    }
  });

  test('should have proper required field indicators', async ({ page }) => {
    // Arrange
    const inputs = [
      SELECTORS.nameInput,
      SELECTORS.emailInput,
      SELECTORS.messageTextarea,
    ];

    for (const inputSelector of inputs) {
      const input = page.locator(inputSelector).first();
      const inputExists = await input.count() > 0;
      
      if (!inputExists) continue;

      // Act
      const requiredInfo = await input.evaluate(el => ({
        required: el.required,
        ariaRequired: el.getAttribute('aria-required'),
      }));

      // Assert
      if (requiredInfo.required) {
        expect(requiredInfo.ariaRequired).toBe('true');
      }
    }
  });

  test('should associate error messages with inputs', async ({ page }) => {
    // Arrange
    await fillContactForm(page, TEST_DATA.invalidEmail);
    const submitButton = page.locator(SELECTORS.submitButton).first();

    // Act
    await submitButton.click();
    await page.waitForTimeout(500);

    const emailInput = page.locator(SELECTORS.emailInput).first();
    const emailInputExists = await emailInput.count() > 0;

    if (emailInputExists) {
      const inputInfo = await emailInput.evaluate(el => ({
        ariaDescribedby: el.getAttribute('aria-describedby'),
        ariaInvalid: el.getAttribute('aria-invalid'),
      }));

      // Assert
      if (inputInfo.ariaInvalid === 'true') {
        expect(inputInfo.ariaDescribedby).toBeTruthy();
      }
    }
  });
});

// ============================================================================
// 4. KEYBOARD NAVIGATION
// ============================================================================

test.describe('Keyboard Navigation', () => {
  test('should navigate through form with Tab key', async ({ page }) => {
    // Arrange
    const contactForm = page.locator(SELECTORS.contactForm).first();
    await contactForm.scrollIntoViewIfNeeded();

    // Act
    await page.keyboard.press('Tab'); // First focusable element
    const firstFocus = await page.evaluate(() => document.activeElement?.tagName);

    await page.keyboard.press('Tab'); // Second focusable element
    const secondFocus = await page.evaluate(() => document.activeElement?.tagName);

    // Assert
    expect(['INPUT', 'TEXTAREA', 'BUTTON', 'A']).toContain(firstFocus);
    expect(['INPUT', 'TEXTAREA', 'BUTTON', 'A']).toContain(secondFocus);
  });

  test('should navigate backwards with Shift+Tab', async ({ page }) => {
    // Arrange
    const contactForm = page.locator(SELECTORS.contactForm).first();
    await contactForm.scrollIntoViewIfNeeded();

    // Act
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const forwardFocus = await page.evaluate(() => document.activeElement?.tagName);

    await page.keyboard.press('Shift+Tab');
    const backwardFocus = await page.evaluate(() => document.activeElement?.tagName);

    // Assert
    expect(['INPUT', 'TEXTAREA', 'BUTTON', 'A']).toContain(forwardFocus);
    expect(['INPUT', 'TEXTAREA', 'BUTTON', 'A']).toContain(backwardFocus);
  });

  test('should have visible focus indicators', async ({ page }) => {
    // Arrange
    const submitButton = page.locator(SELECTORS.submitButton).first();
    await submitButton.scrollIntoViewIfNeeded();

    // Act
    await submitButton.focus();
    await page.waitForTimeout(300);

    const focusStyles = await submitButton.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        outlineStyle: styles.outlineStyle,
        outlineColor: styles.outlineColor,
        boxShadow: styles.boxShadow,
      };
    });

    // Assert
    const hasFocusIndicator = 
      (focusStyles.outline && focusStyles.outline !== 'none') ||
      (focusStyles.outlineWidth && focusStyles.outlineWidth !== '0px') ||
      (focusStyles.boxShadow && focusStyles.boxShadow !== 'none');

    expect(hasFocusIndicator).toBe(true);
  });

  test('should maintain logical focus order', async ({ page }) => {
    // Arrange
    const storeInfoSection = page.locator(SELECTORS.storeInfoSection).first();
    await storeInfoSection.scrollIntoViewIfNeeded();

    // Act
    const focusOrder = await getFocusOrder(page, SELECTORS.storeInfoSection);

    // Assert
    expect(focusOrder.length).toBeGreaterThan(0);
    
    // Check for positive tabindex (anti-pattern)
    const positiveTabindex = focusOrder.filter(el => 
      el.tabindex && parseInt(el.tabindex) > 0
    );
    expect(positiveTabindex).toHaveLength(0);
  });

  test('should submit form with Enter key', async ({ page }) => {
    // Arrange
    await fillContactForm(page, TEST_DATA.validForm);
    const submitButton = page.locator(SELECTORS.submitButton).first();
    await submitButton.focus();

    // Act
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/contact') || response.url().includes('/submit'),
      { timeout: 5000 }
    ).catch(() => null);

    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Assert - form should attempt submission
    const response = await responsePromise;
    // If no API endpoint, check for client-side validation or success message
    if (!response) {
      const successMessage = page.locator('.success-message, [role="status"]').first();
      const errorMessage = page.locator(SELECTORS.fieldError).first();
      const messageExists = 
        await successMessage.count() > 0 || 
        await errorMessage.count() > 0;
      
      // Either success or validation should occur
      expect(messageExists).toBe(true);
    }
  });

  test('should activate button with Space key', async ({ page }) => {
    // Arrange
    const submitButton = page.locator(SELECTORS.submitButton).first();
    await submitButton.focus();

    // Act
    const clickPromise = page.evaluate(() => {
      return new Promise(resolve => {
        const button = document.querySelector('button[type="submit"]');
        button?.addEventListener('click', () => resolve(true), { once: true });
        setTimeout(() => resolve(false), 1000);
      });
    });

    await page.keyboard.press('Space');
    const wasClicked = await clickPromise;

    // Assert
    expect(wasClicked).toBe(true);
  });

  test('should trap focus in modal dialogs', async ({ page }) => {
    // Arrange - trigger modal if exists
    const modalTrigger = page.locator('[data-modal-trigger], .modal-trigger').first();
    const modalExists = await modalTrigger.count() > 0;

    if (!modalExists) {
      test.skip();
      return;
    }

    // Act
    await modalTrigger.click();
    await page.waitForTimeout(500);

    const modal = page.locator('[role="dialog"], .modal').first();
    const modalVisible = await modal.isVisible();

    if (modalVisible) {
      // Tab through modal
      await page.keyboard.press('Tab');
      const firstFocus = await page.evaluate(() => document.activeElement);
      
      // Tab multiple times
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
      }
      
      const finalFocus = await page.evaluate(() => document.activeElement);
      
      // Assert - focus should stay within modal
      const focusInModal = await page.evaluate((modalEl, focusEl) => {
        return modalEl?.contains(focusEl);
      }, await modal.elementHandle(), finalFocus);

      expect(focusInModal).toBe(true);
    }
  });
});

// ============================================================================
// 5. COLOR CONTRAST COMPLIANCE
// ============================================================================

test.describe('Color Contrast Compliance', () => {
  test('should have sufficient contrast for body text', async ({ page }) => {
    // Arrange
    const bodyText = page.locator('body, p, div').first();

    // Act
    const contrastRatio = await getContrastRatio(page, 'body');

    // Assert
    if (contrastRatio) {
      expect(contrastRatio).toBeGreaterThanOrEqual(CONTRAST_REQUIREMENTS.normalText);
    }
  });

  test('should have sufficient contrast for headings', async ({ page }) => {
    // Arrange
    const heading = page.locator(SELECTORS.storeInfoHeading).first();
    const headingExists = await heading.count() > 0;

    if (!headingExists) {
      test.skip();
      return;
    }

    // Act
    const selector = await heading.evaluate(el => {
      return el.className ? `.${el.className.split(' ')[0]}` : 'h2';
    });
    const contrastRatio = await getContrastRatio(page, selector);

    // Assert
    if (contrastRatio) {
      expect(contrastRatio).toBeGreaterThanOrEqual(CONTRAST_REQUIREMENTS.normalText);
    }
  });

  test('should have sufficient contrast for form labels', async ({ page }) => {
    // Arrange
    const labels = page.locator('label');
    const labelCount = await labels.count();

    if (labelCount === 0) {
      test.skip();
      return;
    }

    // Act & Assert
    for (let i = 0; i < Math.min(labelCount, 5); i++) {
      const label = labels.nth(i);
      const labelClass = await label.getAttribute('class');
      const selector = labelClass ? `.${labelClass.split(' ')[0]}` : 'label';
      
      const contrastRatio = await getContrastRatio(page, selector);
      
      if (contrastRatio) {
        expect(contrastRatio).toBeGreaterThanOrEqual(CONTRAST_REQUIREMENTS.normalText);
      }
    }
  });

  test('should have sufficient contrast for buttons', async ({ page }) => {
    // Arrange
    const submitButton = page.locator(SELECTORS.submitButton).first();

    // Act
    const selector = await submitButton.evaluate(el => {
      return el.className ? `.${el.className.split(' ')[0]}` : 'button[type="submit"]';
    });
    const contrastRatio = await getContrastRatio(page, selector);

    // Assert
    if (contrastRatio) {
      expect(contrastRatio).toBeGreaterThanOrEqual(CONTRAST_REQUIREMENTS.uiComponents);
    }
  });

  test('should have sufficient contrast for links', async ({ page }) => {
    // Arrange
    const links = page.locator('a[href]');
    const linkCount = await links.count();

    if (linkCount === 0) {
      test.skip();
      return;
    }

    // Act & Assert
    for (let i = 0; i < Math.min(linkCount, 3); i++) {
      const link = links.nth(i);
      const linkClass = await link.getAttribute('class');
      const selector = linkClass ? `.${linkClass.split(' ')[0]}` : 'a';
      
      const contrastRatio = await getContrastRatio(page, selector);
      
      if (contrastRatio) {
        expect(contrastRatio).toBeGreaterThanOrEqual(CONTRAST_REQUIREMENTS.normalText);
      }
    }
  });

  test('should have sufficient contrast for error messages', async ({ page }) => {
    // Arrange
    await fillContactForm(page, TEST_DATA.invalidEmail);
    const submitButton = page.locator(SELECTORS.submitButton).first();
    await submitButton.click();
    await page.waitForTimeout(500);

    const errorMessage = page.locator(SELECTORS.fieldError).first();
    const errorExists = await errorMessage.count() > 0;

    if (!errorExists) {
      test.skip();
      return;
    }

    // Act
    const selector = await errorMessage.evaluate(el => {
      return el.className ? `.${el.className.split(' ')[0]}` : '.field-error';
    });
    const contrastRatio = await getContrastRatio(page, selector);

    // Assert
    if (contrastRatio) {
      expect(contrastRatio).toBeGreaterThanOrEqual(CONTRAST_REQUIREMENTS.normalText);
    }
  });
});

// ============================================================================
// 6. ARIA ATTRIBUTES AND ROLES
// ============================================================================

test.describe('ARIA Attributes and Roles', () => {
  test('should have valid ARIA roles', async ({ page }) => {
    // Arrange & Act
    const invalidRoles = await page.evaluate(() => {
      const validRoles = [
        'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
        'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
        'contentinfo', 'definition', 'dialog', 'directory', 'document',
        'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading',
        'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
        'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox',
        'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation',
        'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup',
        'rowheader', 'scrollbar', 'search', 'searchbox', 'separator', 'slider',
        'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist', 'tabpanel',
        'term', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid',
        'treeitem'
      ];

      const elementsWithRole = Array.from(document.querySelectorAll('[role]'));
      return elementsWithRole
        .filter(el => !validRoles.includes(el.getAttribute('role')))
        .map(el => ({
          role: el.getAttribute('role'),
          html: el.outerHTML.substring(0, 100),
        }));
    });

    // Assert
    expect(invalidRoles).toHaveLength(0);
  });

  test('should have valid ARIA attributes', async ({ page }) => {
    // Arrange & Act
    const invalidAriaAttrs = await page.evaluate(() => {
      const validAriaAttrs = [
        'aria-activedescendant', 'aria-atomic', 'aria-autocomplete',
        'aria-busy', 'aria-checked', 'aria-colcount', 'aria-colindex',
        'aria-colspan', 'aria-controls', 'aria-current', 'aria-describedby',
        'aria-details', 'aria-disabled', 'aria-dropeffect', 'aria-errormessage',
        'aria-expanded', 'aria-flowto', 'aria-grabbed', 'aria-haspopup',
        'aria-hidden', 'aria-invalid', 'aria-keyshortcuts', 'aria-label',
        'aria-labelledby', 'aria-level', 'aria-live', 'aria-modal',
        'aria-multiline', 'aria-multiselectable', 'aria-orientation',
        'aria-owns', 'aria-placeholder', 'aria-posinset', 'aria-pressed',
        'aria-readonly', 'aria-relevant', 'aria-required', 'aria-roledescription',
        'aria-rowcount', 'aria-rowindex', 'aria-rowspan', 'aria-selected',
        'aria-setsize', 'aria-sort', 'aria-valuemax', 'aria-valuemin',
        'aria-valuenow', 'aria-valuetext'
      ];

      const elementsWithAria = Array.from(document.querySelectorAll('[aria-*]'));
      const invalid = [];

      elementsWithAria.forEach(el => {
        Array.from(el.attributes).forEach(attr => {
          if (attr.name.startsWith('aria-') && !validAriaAttrs.includes(attr.name)) {
            invalid.push({
              attribute: attr.name,
              value: attr.value,
              html: el.outerHTML.substring(0, 100),
            });
          }
        });
      });

      return invalid;
    });

    // Assert
    expect(invalidAriaAttrs).toHaveLength(0);
  });

  test('should have proper ARIA live regions for dynamic content', async ({ page }) => {
    // Arrange
    await fillContactForm(page, TEST_DATA.invalidEmail);
    const submitButton = page.locator(SELECTORS.submitButton).first();

    // Act
    await submitButton.click();
    await page.waitForTimeout(500);

    const liveRegions = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[aria-live], [role="alert"], [role="status"]'))
        .map(el => ({
          ariaLive: el.getAttribute('aria-live'),
          role: el.getAttribute('role'),
          ariaAtomic: el.getAttribute('aria-atomic'),
          text: el.textContent?.trim(),
        }));
    });

    // Assert
    if (liveRegions.length > 0) {
      liveRegions.forEach(region => {
        expect(['polite', 'assertive', 'off']).toContain(region.ariaLive || 'off');
      });
    }
  });

  test('should have proper ARIA expanded states for collapsible content', async ({ page }) => {
    // Arrange
    const expandableElements = page.locator('[aria-expanded]');
    const expandableCount = await expandableElements.count();

    if (expandableCount === 0) {
      test.skip();
      return;
    }

    // Act & Assert
    for (let i = 0; i < expandableCount; i++) {
      const element = expandableElements.nth(i);
      const ariaExpanded = await element.getAttribute('aria-expanded');
      
      expect(['true', 'false']).toContain(ariaExpanded);
    }
  });

  test('should have proper ARIA controls relationships', async ({ page }) => {
    // Arrange
    const controlElements = page.locator('[aria-controls]');
    const controlCount = await controlElements.count();

    if (controlCount === 0) {
      test.skip();
      return;
    }

    // Act & Assert
    for (let i = 0; i < controlCount; i++) {
      const element = controlElements.nth(i);
      const ariaControls = await element.getAttribute('aria-controls');
      
      expect(ariaControls).toBeTruthy();
      
      // Check if controlled element exists
      const controlledElement = page.locator(`#${ariaControls}`).first();
      const controlledExists = await controlledElement.count() > 0;
      
      expect(controlledExists).toBe(true);
    }
  });
});

// ============================================================================
// 7. SEMANTIC HTML STRUCTURE
// ============================================================================

test.describe('Semantic HTML Structure', () => {
  test('should use semantic HTML elements', async ({ page }) => {
    // Arrange & Act
    const semanticElements = await page.evaluate(() => {
      const semantic = ['header', 'nav', 'main', 'article', 'section', 'aside', 'footer'];
      const found = {};
      
      semantic.forEach(tag => {
        found[tag] = document.querySelectorAll(tag).length;
      });
      
      return found;
    });

    // Assert
    const totalSemantic = Object.values(semanticElements).reduce((a, b) => a + b, 0);
    expect(totalSemantic).toBeGreaterThan(0);
  });

  test('should use proper list structure', async ({ page }) => {
    // Arrange
    const lists = page.locator('ul, ol');
    const listCount = await lists.count();

    if (listCount === 0) {
      test.skip();
      return;
    }

    // Act & Assert
    for (let i = 0; i < listCount; i++) {
      const list = lists.nth(i);
      const listInfo = await list.evaluate(el => {
        const children = Array.from(el.children);
        const allLi = children.every(child => child.tagName === 'LI');
        return {
          childCount: children.length,
          allLi,
          tagName: el.tagName,
        };
      });

      expect(listInfo.childCount).toBeGreaterThan(0);
      expect(listInfo.allLi).toBe(true);
    }
  });

  test('should use proper table structure', async ({ page }) => {
    // Arrange
    const tables = page.locator('table');
    const tableCount = await tables.count();

    if (tableCount === 0) {
      test.skip();
      return;
    }

    // Act & Assert
    for (let i = 0; i < tableCount; i++) {
      const table = tables.nth(i);
      const tableInfo = await table.evaluate(el => ({
        hasCaption: !!el.querySelector('caption'),
        hasThead: !!el.querySelector('thead'),
        hasTbody: !!el.querySelector('tbody'),
        hasThElements: el.querySelectorAll('th').length > 0,
      }));

      // Tables should have proper structure
      expect(tableInfo.hasThead || tableInfo.hasThElements).toBe(true);
    }
  });

  test('should have proper button elements', async ({ page }) => {
    // Arrange
    const buttons = page.locator('button, [role="button"]');
    const buttonCount = await buttons.count();

    if (buttonCount === 0) {
      test.skip();
      return;
    }

    // Act & Assert
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const buttonInfo = await button.evaluate(el => ({
        tagName: el.tagName,
        type: el.getAttribute('type'),
        role: el.getAttribute('role'),
        hasText: (el.textContent?.trim().length || 0) > 0,
        ariaLabel: el.getAttribute('aria-label'),
      }));

      // Button should have accessible name
      const hasAccessibleName = buttonInfo.hasText || buttonInfo.ariaLabel;
      expect(hasAccessibleName).toBe(true);
    }
  });
});

// ============================================================================
// 8. TOUCH TARGET SIZES
// ============================================================================

test.describe('Touch Target Sizes', () => {
  test('should have minimum touch target size for buttons', async ({ page }) => {
    // Arrange
    const submitButton = page.locator(SELECTORS.submitButton).first();

    // Act
    const dimensions = await getElementDimensions(page, SELECTORS.submitButton);

    // Assert
    if (dimensions) {
      expect(dimensions.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
      expect(dimensions.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
    }
  });

  test('should have minimum touch target size for links', async ({ page }) => {
    // Arrange
    const links = page.locator('a[href]');
    const linkCount = await links.count();

    if (linkCount === 0) {
      test.skip();
      return;
    }

    // Act & Assert
    for (let i = 0; i < Math.min(linkCount, 3); i++) {
      const link = links.nth(i);
      const box = await link.boundingBox();

      if (box) {
        // Links should be at least 44x44px or have sufficient padding
        const meetsSize = box.width >= MIN_TOUCH_TARGET_SIZE && box.height >= MIN_TOUCH_TARGET_SIZE;
        const hasMinDimension = box.width >= 24 && box.height >= 24; // Minimum with padding
        
        expect(meetsSize || hasMinDimension).toBe(true);
      }
    }
  });

  test('should have sufficient spacing between interactive elements', async ({ page }) => {
    // Arrange
    const interactiveElements = page.locator('button, a[href], input, select, textarea');
    const elementCount = await interactiveElements.count();

    if (elementCount < 2) {
      test.skip();
      return;
    }

    // Act
    const positions = [];
    for (let i = 0; i < Math.min(elementCount, 5); i++) {
      const element = interactiveElements.nth(i);
      const box = await element.boundingBox();
      if (box) {
        positions.push(box);
      }
    }

    // Assert
    for (let i = 0; i < positions.length - 1; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const box1 = positions[i];
        const box2 = positions[j];

        // Calculate distance between elements
        const horizontalDistance = Math.abs(box1.x - box2.x);
        const verticalDistance = Math.abs(box1.y - box2.y);

        // Elements should have at least 8px spacing or not overlap
        const hasSpacing = 
          horizontalDistance > (box1.width + 8) ||
          verticalDistance > (box1.height + 8);

        // This is a soft check - elements can be close if properly designed
        if (!hasSpacing) {
          // Elements are close - ensure they don't overlap
          const overlaps = 
            box1.x < box2.x + box2.width &&
            box1.x + box1.width > box2.x &&
            box1.y < box2.y + box2.height &&
            box1.y + box1.height > box2.y;

          expect(overlaps).toBe(false);
        }
      }
    }
  });
});

// ============================================================================
// 9. SCREEN READER COMPATIBILITY
// ============================================================================

test.describe('Screen Reader Compatibility', () => {
  test('should have descriptive alt text for images', async ({ page }) => {
    // Arrange
    const images = page.locator('img');
    const imageCount = await images.count();

    if (imageCount === 0) {
      test.skip();
      return;
    }

    // Act & Assert
    for (let i = 0; i < imageCount; i++) {
      const image = images.nth(i);
      const imageInfo = await image.evaluate(el => ({
        alt: el.getAttribute('alt'),
        role: el.getAttribute('role'),
        ariaLabel: el.getAttribute('aria-label'),
        src: el.src,
      }));

      // Decorative images should have empty alt or role="presentation"
      // Content images should have descriptive alt text
      const isDecorative = 
        imageInfo.alt === '' || 
        imageInfo.role === 'presentation' || 
        imageInfo.role === 'none';

      if (!isDecorative) {
        const hasAccessibleName = 
          (imageInfo.alt && imageInfo.alt.length > 0) || 
          imageInfo.ariaLabel;
        
        expect(hasAccessibleName).toBe(true);
      }
    }
  });

  test('should have proper iframe titles', async ({ page }) => {
    // Arrange
    const iframes = page.locator('iframe');
    const iframeCount = await iframes.count();

    if (iframeCount === 0) {
      test.skip();
      return;
    }

    // Act & Assert
    for (let i = 0; i < iframeCount; i++) {
      const iframe = iframes.nth(i);
      const title = await iframe.getAttribute('title');
      const ariaLabel = await iframe.getAttribute('aria-label');

      const hasAccessibleName = (title && title.length > 0) || ariaLabel;
      expect(hasAccessibleName).toBe(true);
    }
  });

  test('should announce form submission status', async ({ page }) => {
    // Arrange
    await fillContactForm(page, TEST_DATA.validForm);
    const submitButton = page.locator(SELECTORS.submitButton).first();

    // Act
    await submitButton.click();
    await page.waitForTimeout(1000);

    // Assert - check for status announcement
    const statusRegions = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll('[role="status"], [role="alert"], [aria-live]')
      ).map(el => ({
        role: el.getAttribute('role'),
        ariaLive: el.getAttribute('aria-live'),
        text: el.textContent?.trim(),
      }));
    });

    // Should have at least one status announcement
    const hasStatusAnnouncement = statusRegions.some(region => 
      region.text && region.text.length > 0
    );

    expect(hasStatusAnnouncement).toBe(true);
  });

  test('should have proper visually hidden text for icon buttons', async ({ page }) => {
    // Arrange
    const iconButtons = page.locator('button:has(svg), button:has(i), button:has(.icon)');
    const iconButtonCount = await iconButtons.count();

    if (iconButtonCount === 0) {
      test.skip();
      return;
    }

    // Act & Assert
    for (let i = 0; i < iconButtonCount; i++) {
      const button = iconButtons.nth(i);
      const buttonInfo = await button.evaluate(el => ({
        text: el.textContent?.trim(),
        ariaLabel: el.getAttribute('aria-label'),
        ariaLabelledby: el.getAttribute('aria-labelledby'),
        title: el.getAttribute('title'),
      }));

      const hasAccessibleName = 
        (buttonInfo.text && buttonInfo.text.length > 0) ||
        buttonInfo.ariaLabel ||
        buttonInfo.ariaLabelledby ||
        buttonInfo.title;

      expect(hasAccessibleName).toBe(true);
    }
  });
});

// ============================================================================
// 10. RESPONSIVE ACCESSIBILITY
// ============================================================================

test.describe('Responsive Accessibility', () => {
  for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
    test(`should maintain accessibility at ${viewportName} viewport`, async ({ page }) => {
      // Arrange
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);

      // Act & Assert
      await assertNoViolations(page, null, `responsive-${viewportName}`);
    });

    test(`should have proper focus management at ${viewportName} viewport`, async ({ page }) => {
      // Arrange
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);

      // Act
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => ({
        tagName: document.activeElement?.tagName,
        visible: document.activeElement ? 
          window.getComputedStyle(document.activeElement).display !== 'none' : false,
      }));

      // Assert
      expect(focusedElement.visible).toBe(true);
    });
  }
});

// ============================================================================
// 11. DARK MODE ACCESSIBILITY
// ============================================================================

test.describe('Dark Mode Accessibility', () => {
  test('should maintain accessibility in dark mode', async ({ page }) => {
    // Arrange
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(500);

    // Act & Assert
    await assertNoViolations(page, null, 'dark-mode');
  });

  test('should have sufficient contrast in dark mode', async ({ page }) => {
    // Arrange
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(500);

    // Act
    const contrastRatio = await getContrastRatio(page, 'body');

    // Assert
    if (contrastRatio) {
      expect(contrastRatio).toBeGreaterThanOrEqual(CONTRAST_REQUIREMENTS.normalText);
    }
  });
});

// ============================================================================
// 12. REDUCED MOTION ACCESSIBILITY
// ============================================================================

test.describe('Reduced Motion Accessibility', () => {
  test('should respect reduced motion preference', async ({ page }) => {
    // Arrange
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(500);

    // Act
    const animations = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      return elements.map(el => {
        const styles = window.getComputedStyle(el);
        return {
          animationDuration: styles.animationDuration,
          transitionDuration: styles.transitionDuration,
        };
      }).filter(style => 
        (style.animationDuration && style.animationDuration !== '0s') ||
        (style.transitionDuration && style.transitionDuration !== '0s')
      );
    });

    // Assert - animations should be minimal or instant
    animations.forEach(anim => {
      const animDuration = parseFloat(anim.animationDuration || '0');
      const transDuration = parseFloat(anim.transitionDuration || '0');
      
      // Durations should be very short (< 0.1s) when reduced motion is preferred
      expect(animDuration).toBeLessThan(0.1);
      expect(transDuration).toBeLessThan(0.1);
    });
  });
});

// ============================================================================
// 13. HIGH CONTRAST MODE ACCESSIBILITY
// ============================================================================

test.describe('High Contrast Mode Accessibility', () => {
  test('should maintain accessibility in high contrast mode', async ({ page }) => {
    // Arrange
    await page.emulateMedia({ forcedColors: 'active' });
    await page.waitForTimeout(500);

    // Act & Assert
    await assertNoViolations(page, null, 'high-contrast');
  });

  test('should have visible focus indicators in high contrast mode', async ({ page }) => {
    // Arrange
    await page.emulateMedia({ forcedColors: 'active' });
    await page.waitForTimeout(500);
    const submitButton = page.locator(SELECTORS.submitButton).first();

    // Act
    await submitButton.focus();
    await page.waitForTimeout(300);

    const focusStyles = await submitButton.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
      };
    });

    // Assert
    const hasFocusIndicator = 
      focusStyles.outline !== 'none' && 
      focusStyles.outlineWidth !== '0px';

    expect(hasFocusIndicator).toBe(true);
  });
});

// ============================================================================
// 14. FORM VALIDATION ACCESSIBILITY
// ============================================================================

test.describe('Form Validation Accessibility', () => {
  test('should announce validation errors to screen readers', async ({ page }) => {
    // Arrange
    await fillContactForm(page, TEST_DATA.invalidEmail);
    const submitButton = page.locator(SELECTORS.submitButton).first();

    // Act
    await submitButton.click();
    await page.waitForTimeout(500);

    // Assert
    const errorAnnouncements = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll('[role="alert"], [aria-live="assertive"], [aria-live="polite"]')
      ).map(el => ({
        role: el.getAttribute('role'),
        ariaLive: el.getAttribute('aria-live'),
        text: el.textContent?.trim(),
      }));
    });

    const hasErrorAnnouncement = errorAnnouncements.some(announcement => 
      announcement.text && announcement.text.length > 0
    );

    expect(hasErrorAnnouncement).toBe(true);
  });

  test('should associate error messages with form fields', async ({ page }) => {
    // Arrange
    await fillContactForm(page, TEST_DATA.invalidEmail);
    const submitButton = page.locator(SELECTORS.submitButton).first();

    // Act
    await submitButton.click();
    await page.waitForTimeout(500);

    const emailInput = page.locator(SELECTORS.emailInput).first();
    const emailInputExists = await emailInput.count() > 0;

    if (emailInputExists) {
      const associations = await emailInput.evaluate(el => ({
        ariaDescribedby: el.getAttribute('aria-describedby'),
        ariaInvalid: el.getAttribute('aria-invalid'),
        ariaErrormessage: el.getAttribute('aria-errormessage'),
      }));

      // Assert
      if (associations.ariaInvalid === 'true') {
        const hasErrorAssociation = 
          associations.ariaDescribedby || 
          associations.ariaErrormessage;
        
        expect(hasErrorAssociation).toBeTruthy();
      }
    }
  });

  test('should move focus to first error on validation', async ({ page }) => {
    // Arrange
    await fillContactForm(page, TEST_DATA.invalidEmail);
    const submitButton = page.locator(SELECTORS.submitButton).first();

    // Act
    await submitButton.click();
    await page.waitForTimeout(500);

    const focusedElement = await page.evaluate(() => ({
      tagName: document.activeElement?.tagName,
      name: document.activeElement?.getAttribute('name'),
      ariaInvalid: document.activeElement?.getAttribute('aria-invalid'),
    }));

    // Assert - focus should move to invalid field or error summary
    const focusOnError = 
      focusedElement.ariaInvalid === 'true' ||
      focusedElement.tagName === 'INPUT' ||
      focusedElement.tagName === 'TEXTAREA';

    expect(focusOnError).toBe(true);
  });
});

// ============================================================================
// 15. COMPREHENSIVE WCAG 2.1 AA AUDIT
// ============================================================================

test.describe('Comprehensive WCAG 2.1 AA Audit', () => {
  test('should pass complete WCAG 2.1 Level A audit', async ({ page }) => {
    // Arrange
    const axeBuilder = new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag21a']);

    // Act
    const results = await axeBuilder.analyze();

    // Assert
    if (results.violations.length > 0) {
      const formattedViolations = formatViolations(results.violations);
      console.error('WCAG 2.1 Level A Violations:', JSON.stringify(formattedViolations, null, 2));
    }

    expect(results.violations).toHaveLength(0);
  });

  test('should pass complete WCAG 2.1 Level AA audit', async ({ page }) => {
    // Arrange
    const axeBuilder = new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa']);

    // Act
    const results = await axeBuilder.analyze();

    // Assert
    if (results.violations.length > 0) {
      const formattedViolations = formatViolations(results.violations);
      console.error('WCAG 2.1 Level AA Violations:', JSON.stringify(formattedViolations, null, 2));
      
      // Take screenshot
      await page.screenshot({
        path: `test-results/wcag-aa-violations-${Date.now()}.png`,
        fullPage: true,
      });
    }

    expect(results.violations).toHaveLength(0);
  });

  test('should generate accessibility report', async ({ page }) => {
    // Arrange
    const axeBuilder = new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);

    // Act
    const results = await axeBuilder.analyze();

    // Generate report
    const report = {
      url: page.url(),
      timestamp: new Date().toISOString(),
      violations: formatViolations(results.violations),
      passes: results.passes.length,
      incomplete: results.incomplete.length,
      inapplicable: results.inapplicable.length,
      summary: {
        critical: results.violations.filter(v => v.impact === 'critical').length,
        serious: results.violations.filter(v => v.impact === 'serious').length,
        moderate: results.violations.filter(v => v.impact === 'moderate').length,
        minor: results.violations.filter(v => v.impact === 'minor').length,
      },
    };

    // Assert
    console.log('Accessibility Report:', JSON.stringify(report, null, 2));
    expect(report.violations).toHaveLength(0);
  });
});