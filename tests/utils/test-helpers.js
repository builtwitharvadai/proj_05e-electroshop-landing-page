/**
 * Test Helper Utilities
 * 
 * Provides common helper functions for Playwright tests including:
 * - Screenshot capture with consistent naming
 * - Element waiting with timeout handling
 * - Viewport management for responsive testing
 * - Test data cleanup utilities
 * - Browser console error capture
 * - Performance metrics collection
 * 
 * @module tests/utils/test-helpers
 */

import { expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Viewport configurations for responsive testing
 */
export const VIEWPORTS = {
  mobile: { width: 320, height: 568 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
};

/**
 * Common timeout values in milliseconds
 */
export const TIMEOUTS = {
  short: 5000,
  medium: 10000,
  long: 30000,
};

/**
 * Takes a screenshot with consistent naming and directory structure
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} testName - Name of the test for screenshot naming
 * @param {string} [suffix=''] - Optional suffix for screenshot name
 * @returns {Promise<Buffer>} Screenshot buffer
 * 
 * @example
 * await takeScreenshot(page, 'homepage-test', 'hero-section');
 */
export async function takeScreenshot(page, testName, suffix = '') {
  const sanitizedTestName = testName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotName = suffix
    ? `${sanitizedTestName}-${suffix}-${timestamp}.png`
    : `${sanitizedTestName}-${timestamp}.png`;

  const screenshotDir = path.join(process.cwd(), 'test-results', 'screenshots');
  
  // Ensure directory exists
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const screenshotPath = path.join(screenshotDir, screenshotName);

  try {
    const screenshot = await page.screenshot({
      path: screenshotPath,
      fullPage: true,
      animations: 'disabled',
    });

    console.log(`Screenshot saved: ${screenshotPath}`);
    return screenshot;
  } catch (error) {
    console.error(`Failed to take screenshot: ${error.message}`);
    throw error;
  }
}

/**
 * Waits for an element to be visible with custom timeout and error handling
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} selector - CSS selector or text selector
 * @param {Object} [options={}] - Wait options
 * @param {number} [options.timeout=TIMEOUTS.medium] - Timeout in milliseconds
 * @param {string} [options.state='visible'] - Element state to wait for
 * @returns {Promise<import('@playwright/test').Locator>} Element locator
 * 
 * @example
 * const button = await waitForElement(page, 'button[type="submit"]');
 * await button.click();
 */
export async function waitForElement(page, selector, options = {}) {
  const {
    timeout = TIMEOUTS.medium,
    state = 'visible',
  } = options;

  try {
    const element = page.locator(selector);
    await element.waitFor({ state, timeout });
    return element;
  } catch (error) {
    console.error(`Element not found: ${selector} (timeout: ${timeout}ms)`);
    await takeScreenshot(page, 'element-wait-failure', selector.replace(/[^a-z0-9]/gi, '-'));
    throw new Error(`Failed to find element: ${selector} - ${error.message}`);
  }
}

/**
 * Sets viewport size for responsive testing
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} size - Viewport size key ('mobile', 'tablet', 'desktop')
 * @returns {Promise<void>}
 * 
 * @example
 * await setViewport(page, 'mobile');
 * await page.goto('/');
 */
export async function setViewport(page, size) {
  const viewport = VIEWPORTS[size];
  
  if (!viewport) {
    throw new Error(`Invalid viewport size: ${size}. Valid options: ${Object.keys(VIEWPORTS).join(', ')}`);
  }

  try {
    await page.setViewportSize(viewport);
    console.log(`Viewport set to ${size}: ${viewport.width}x${viewport.height}`);
  } catch (error) {
    console.error(`Failed to set viewport: ${error.message}`);
    throw error;
  }
}

/**
 * Waits for network to be idle (no pending requests)
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} [options={}] - Wait options
 * @param {number} [options.timeout=TIMEOUTS.medium] - Timeout in milliseconds
 * @returns {Promise<void>}
 * 
 * @example
 * await page.goto('/');
 * await waitForNetworkIdle(page);
 */
export async function waitForNetworkIdle(page, options = {}) {
  const { timeout = TIMEOUTS.medium } = options;

  try {
    await page.waitForLoadState('networkidle', { timeout });
    console.log('Network idle state reached');
  } catch (error) {
    console.warn(`Network idle timeout after ${timeout}ms: ${error.message}`);
  }
}

/**
 * Captures browser console messages and errors
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Object} Console capture object with messages and errors arrays
 * 
 * @example
 * const console = captureConsole(page);
 * await page.goto('/');
 * expect(console.errors).toHaveLength(0);
 */
export function captureConsole(page) {
  const messages = [];
  const errors = [];

  page.on('console', (msg) => {
    const message = {
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
    };
    
    messages.push(message);
    
    if (msg.type() === 'error') {
      errors.push(message);
      console.error(`Browser console error: ${msg.text()}`);
    }
  });

  page.on('pageerror', (error) => {
    const errorMessage = {
      type: 'pageerror',
      text: error.message,
      stack: error.stack,
    };
    
    errors.push(errorMessage);
    console.error(`Page error: ${error.message}`);
  });

  return {
    messages,
    errors,
    hasErrors: () => errors.length > 0,
    getErrors: () => errors,
    getMessages: () => messages,
  };
}

/**
 * Scrolls element into view with smooth behavior
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} selector - CSS selector
 * @param {Object} [options={}] - Scroll options
 * @param {string} [options.behavior='smooth'] - Scroll behavior
 * @returns {Promise<void>}
 * 
 * @example
 * await scrollIntoView(page, '#contact-form');
 */
export async function scrollIntoView(page, selector, options = {}) {
  const { behavior = 'smooth' } = options;

  try {
    await page.locator(selector).scrollIntoViewIfNeeded();
    
    // Wait for scroll animation to complete
    await page.waitForTimeout(500);
    
    console.log(`Scrolled to element: ${selector}`);
  } catch (error) {
    console.error(`Failed to scroll to element: ${selector} - ${error.message}`);
    throw error;
  }
}

/**
 * Fills form field with validation
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} selector - Input field selector
 * @param {string} value - Value to fill
 * @param {Object} [options={}] - Fill options
 * @param {boolean} [options.clear=true] - Clear field before filling
 * @returns {Promise<void>}
 * 
 * @example
 * await fillField(page, 'input[name="email"]', 'test@example.com');
 */
export async function fillField(page, selector, value, options = {}) {
  const { clear = true } = options;

  try {
    const field = await waitForElement(page, selector);
    
    if (clear) {
      await field.clear();
    }
    
    await field.fill(value);
    
    // Verify value was set
    const filledValue = await field.inputValue();
    expect(filledValue).toBe(value);
    
    console.log(`Filled field ${selector} with value: ${value}`);
  } catch (error) {
    console.error(`Failed to fill field ${selector}: ${error.message}`);
    throw error;
  }
}

/**
 * Waits for element to be hidden or removed from DOM
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} selector - CSS selector
 * @param {Object} [options={}] - Wait options
 * @param {number} [options.timeout=TIMEOUTS.medium] - Timeout in milliseconds
 * @returns {Promise<void>}
 * 
 * @example
 * await waitForElementToDisappear(page, '.loading-spinner');
 */
export async function waitForElementToDisappear(page, selector, options = {}) {
  const { timeout = TIMEOUTS.medium } = options;

  try {
    await page.locator(selector).waitFor({ state: 'hidden', timeout });
    console.log(`Element disappeared: ${selector}`);
  } catch (error) {
    console.error(`Element did not disappear: ${selector} (timeout: ${timeout}ms)`);
    throw error;
  }
}

/**
 * Gets computed style property of element
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} selector - CSS selector
 * @param {string} property - CSS property name
 * @returns {Promise<string>} Computed style value
 * 
 * @example
 * const color = await getComputedStyle(page, '.hero-title', 'color');
 */
export async function getComputedStyle(page, selector, property) {
  try {
    const value = await page.locator(selector).evaluate((el, prop) => {
      return window.getComputedStyle(el).getPropertyValue(prop);
    }, property);
    
    return value;
  } catch (error) {
    console.error(`Failed to get computed style: ${error.message}`);
    throw error;
  }
}

/**
 * Checks if element is visible in viewport
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} selector - CSS selector
 * @returns {Promise<boolean>} True if element is in viewport
 * 
 * @example
 * const isVisible = await isInViewport(page, '.hero-section');
 */
export async function isInViewport(page, selector) {
  try {
    const isVisible = await page.locator(selector).evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    });
    
    return isVisible;
  } catch (error) {
    console.error(`Failed to check viewport visibility: ${error.message}`);
    return false;
  }
}

/**
 * Clears browser storage (localStorage, sessionStorage, cookies)
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<void>}
 * 
 * @example
 * await clearBrowserStorage(page);
 */
export async function clearBrowserStorage(page) {
  try {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await page.context().clearCookies();
    
    console.log('Browser storage cleared');
  } catch (error) {
    console.error(`Failed to clear browser storage: ${error.message}`);
    throw error;
  }
}

/**
 * Waits for all images to load on the page
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} [options={}] - Wait options
 * @param {number} [options.timeout=TIMEOUTS.long] - Timeout in milliseconds
 * @returns {Promise<void>}
 * 
 * @example
 * await page.goto('/');
 * await waitForImages(page);
 */
export async function waitForImages(page, options = {}) {
  const { timeout = TIMEOUTS.long } = options;

  try {
    await page.waitForFunction(
      () => {
        const images = Array.from(document.images);
        return images.every((img) => img.complete && img.naturalHeight !== 0);
      },
      { timeout }
    );
    
    console.log('All images loaded');
  } catch (error) {
    console.warn(`Image loading timeout after ${timeout}ms: ${error.message}`);
  }
}

/**
 * Gets performance metrics from the page
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<Object>} Performance metrics object
 * 
 * @example
 * const metrics = await getPerformanceMetrics(page);
 * console.log(`Page load time: ${metrics.loadTime}ms`);
 */
export async function getPerformanceMetrics(page) {
  try {
    const metrics = await page.evaluate(() => {
      const perfData = window.performance.timing;
      const navigation = window.performance.getEntriesByType('navigation')[0];
      
      return {
        loadTime: perfData.loadEventEnd - perfData.navigationStart,
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
        firstPaint: navigation ? navigation.responseStart - navigation.requestStart : 0,
        domInteractive: perfData.domInteractive - perfData.navigationStart,
        resourceCount: window.performance.getEntriesByType('resource').length,
      };
    });
    
    console.log('Performance metrics collected:', metrics);
    return metrics;
  } catch (error) {
    console.error(`Failed to collect performance metrics: ${error.message}`);
    return null;
  }
}

/**
 * Retries an async operation with exponential backoff
 * 
 * @param {Function} operation - Async function to retry
 * @param {Object} [options={}] - Retry options
 * @param {number} [options.maxRetries=3] - Maximum number of retries
 * @param {number} [options.initialDelay=1000] - Initial delay in milliseconds
 * @returns {Promise<*>} Result of the operation
 * 
 * @example
 * const result = await retryOperation(
 *   async () => await page.locator('.dynamic-content').textContent(),
 *   { maxRetries: 5 }
 * );
 */
export async function retryOperation(operation, options = {}) {
  const { maxRetries = 3, initialDelay = 1000 } = options;
  
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Operation failed after ${maxRetries} retries: ${lastError.message}`);
}

/**
 * Cleanup helper to be called in afterEach hooks
 * 
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<void>}
 * 
 * @example
 * test.afterEach(async ({ page }) => {
 *   await cleanup(page);
 * });
 */
export async function cleanup(page) {
  try {
    await clearBrowserStorage(page);
    console.log('Test cleanup completed');
  } catch (error) {
    console.error(`Cleanup failed: ${error.message}`);
  }
}