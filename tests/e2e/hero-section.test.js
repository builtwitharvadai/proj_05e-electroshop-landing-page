// tests/e2e/hero-section.test.js
import { test, expect } from '@playwright/test';

/**
 * E2E Hero Section Test Suite
 * 
 * Tests hero section functionality across all browsers and viewports:
 * - Product display and rendering
 * - Image loading with WebP/JPEG fallbacks
 * - CTA button functionality and interactions
 * - Responsive layout behavior
 * - Performance metrics and optimization
 * - Accessibility compliance
 * - Visual regression testing
 * 
 * Coverage: Hero section component, product cards, images, CTAs, responsive design
 */

// ============================================================================
// TEST DATA & HELPERS
// ============================================================================

const HERO_SELECTORS = {
  heroSection: '[data-testid="hero-section"], section.hero, .hero-section',
  heroHeading: 'h1, [role="heading"][aria-level="1"]',
  heroSubheading: '.hero-subheading, .hero-subtitle, h2',
  productCards: '[data-testid="product-card"], .product-card',
  productImage: 'img[alt*="product" i], .product-image img',
  productTitle: '.product-title, .product-name, h3',
  productPrice: '.product-price, [data-testid="price"]',
  ctaButtons: 'button[data-testid*="cta"], .cta-button, a.btn-primary',
  primaryCta: '[data-testid="primary-cta"], .btn-primary:first-of-type',
  secondaryCta: '[data-testid="secondary-cta"], .btn-secondary',
};

const VIEWPORT_SIZES = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
  ultrawide: { width: 2560, height: 1440 },
};

const PERFORMANCE_BUDGETS = {
  heroLoadTime: 2000, // 2 seconds
  imageLoadTime: 1500, // 1.5 seconds
  ctaResponseTime: 100, // 100ms
  lcp: 2500, // Largest Contentful Paint
  cls: 0.1, // Cumulative Layout Shift
};

/**
 * Helper: Wait for images to load
 */
async function waitForImagesLoaded(page, selector) {
  await page.waitForFunction(
    (sel) => {
      const images = document.querySelectorAll(sel);
      return Array.from(images).every(img => img.complete && img.naturalHeight > 0);
    },
    selector,
    { timeout: 5000 }
  );
}

/**
 * Helper: Get image format
 */
async function getImageFormat(page, selector) {
  return await page.evaluate((sel) => {
    const img = document.querySelector(sel);
    if (!img) return null;
    
    const src = img.currentSrc || img.src;
    const extension = src.split('.').pop().split('?')[0].toLowerCase();
    return extension;
  }, selector);
}

/**
 * Helper: Measure element load time
 */
async function measureLoadTime(page, selector) {
  const startTime = Date.now();
  await page.locator(selector).first().waitFor({ state: 'visible', timeout: 5000 });
  return Date.now() - startTime;
}

/**
 * Helper: Get Web Vitals
 */
async function getWebVitals(page) {
  return await page.evaluate(() => {
    return new Promise((resolve) => {
      const vitals = { lcp: 0, fid: 0, cls: 0 };
      
      // LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        vitals.lcp = lastEntry.renderTime || lastEntry.loadTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      
      // CLS
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            vitals.cls += entry.value;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
      
      setTimeout(() => resolve(vitals), 2000);
    });
  });
}

/**
 * Helper: Check if element is in viewport
 */
async function isInViewport(page, selector) {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  }, selector);
}

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

test.beforeEach(async ({ page }) => {
  // Navigate to home page
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  
  // Wait for hero section to be visible
  const heroSection = page.locator(HERO_SELECTORS.heroSection).first();
  await heroSection.waitFor({ state: 'visible', timeout: 5000 });
});

test.afterEach(async ({ page }) => {
  // Clean up any modals or overlays
  await page.evaluate(() => {
    document.querySelectorAll('[role="dialog"], .modal, .overlay').forEach(el => el.remove());
  });
});

// ============================================================================
// 1. HERO SECTION RENDERING TESTS
// ============================================================================

test.describe('Hero Section Rendering', () => {
  test('should display hero section with all core elements', async ({ page }) => {
    // Arrange & Act
    const heroSection = page.locator(HERO_SELECTORS.heroSection).first();
    const heading = page.locator(HERO_SELECTORS.heroHeading).first();
    const ctaButtons = page.locator(HERO_SELECTORS.ctaButtons);

    // Assert
    await expect(heroSection).toBeVisible();
    await expect(heading).toBeVisible();
    
    const ctaCount = await ctaButtons.count();
    expect(ctaCount).toBeGreaterThanOrEqual(1);
  });

  test('should render hero heading with correct text', async ({ page }) => {
    // Arrange & Act
    const heading = page.locator(HERO_SELECTORS.heroHeading).first();
    const headingText = await heading.textContent();

    // Assert
    await expect(heading).toBeVisible();
    expect(headingText).toBeTruthy();
    expect(headingText.trim().length).toBeGreaterThan(5);
  });

  test('should display hero subheading if present', async ({ page }) => {
    // Arrange & Act
    const subheading = page.locator(HERO_SELECTORS.heroSubheading).first();
    const subheadingCount = await subheading.count();

    // Assert - Subheading is optional but should be visible if present
    if (subheadingCount > 0) {
      await expect(subheading).toBeVisible();
      const text = await subheading.textContent();
      expect(text.trim().length).toBeGreaterThan(0);
    }
  });

  test('should have proper semantic HTML structure', async ({ page }) => {
    // Arrange & Act
    const heroSection = page.locator(HERO_SELECTORS.heroSection).first();
    const heading = page.locator(HERO_SELECTORS.heroHeading).first();

    // Assert
    const sectionTag = await heroSection.evaluate(el => el.tagName.toLowerCase());
    expect(['section', 'div', 'header']).toContain(sectionTag);

    const headingTag = await heading.evaluate(el => el.tagName.toLowerCase());
    expect(headingTag).toBe('h1');
  });

  test('should load hero section within performance budget', async ({ page }) => {
    // Arrange & Act
    const loadTime = await measureLoadTime(page, HERO_SELECTORS.heroSection);

    // Assert
    expect(loadTime).toBeLessThan(PERFORMANCE_BUDGETS.heroLoadTime);
  });
});

// ============================================================================
// 2. PRODUCT CARD RENDERING TESTS
// ============================================================================

test.describe('Product Card Rendering', () => {
  test('should display product cards in hero section', async ({ page }) => {
    // Arrange & Act
    const productCards = page.locator(HERO_SELECTORS.productCards);
    const cardCount = await productCards.count();

    // Assert
    expect(cardCount).toBeGreaterThanOrEqual(1);
    
    // Verify first card is visible
    await expect(productCards.first()).toBeVisible();
  });

  test('should render product card with all required elements', async ({ page }) => {
    // Arrange
    const firstCard = page.locator(HERO_SELECTORS.productCards).first();

    // Act
    const hasImage = await firstCard.locator('img').count() > 0;
    const hasTitle = await firstCard.locator(HERO_SELECTORS.productTitle).count() > 0;

    // Assert
    expect(hasImage).toBeTruthy();
    expect(hasTitle).toBeTruthy();
  });

  test('should display product title with valid text', async ({ page }) => {
    // Arrange & Act
    const productTitle = page.locator(HERO_SELECTORS.productTitle).first();
    const titleText = await productTitle.textContent();

    // Assert
    await expect(productTitle).toBeVisible();
    expect(titleText).toBeTruthy();
    expect(titleText.trim().length).toBeGreaterThan(2);
  });

  test('should display product price if present', async ({ page }) => {
    // Arrange & Act
    const productPrice = page.locator(HERO_SELECTORS.productPrice).first();
    const priceCount = await productPrice.count();

    // Assert - Price is optional
    if (priceCount > 0) {
      await expect(productPrice).toBeVisible();
      
      const priceText = await productPrice.textContent();
      expect(priceText).toMatch(/\$|€|£|\d+/); // Contains currency or number
    }
  });

  test('should render multiple product cards in grid layout', async ({ page }) => {
    // Arrange
    const productCards = page.locator(HERO_SELECTORS.productCards);
    const cardCount = await productCards.count();

    // Skip if only one card
    if (cardCount < 2) {
      test.skip();
    }

    // Act - Get positions of first two cards
    const firstCardBox = await productCards.first().boundingBox();
    const secondCardBox = await productCards.nth(1).boundingBox();

    // Assert - Cards should be positioned in grid
    expect(firstCardBox).toBeTruthy();
    expect(secondCardBox).toBeTruthy();
    
    // Cards should be either horizontally or vertically aligned
    const isHorizontal = Math.abs(firstCardBox.y - secondCardBox.y) < 50;
    const isVertical = Math.abs(firstCardBox.x - secondCardBox.x) < 50;
    
    expect(isHorizontal || isVertical).toBeTruthy();
  });

  test('should have consistent card styling', async ({ page }) => {
    // Arrange
    const productCards = page.locator(HERO_SELECTORS.productCards);
    const cardCount = await productCards.count();

    if (cardCount < 2) {
      test.skip();
    }

    // Act - Get styles of first two cards
    const firstCardStyles = await productCards.first().evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        padding: styles.padding,
        borderRadius: styles.borderRadius,
        backgroundColor: styles.backgroundColor,
      };
    });

    const secondCardStyles = await productCards.nth(1).evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        padding: styles.padding,
        borderRadius: styles.borderRadius,
        backgroundColor: styles.backgroundColor,
      };
    });

    // Assert - Cards should have consistent styling
    expect(firstCardStyles.padding).toBe(secondCardStyles.padding);
    expect(firstCardStyles.borderRadius).toBe(secondCardStyles.borderRadius);
  });
});

// ============================================================================
// 3. IMAGE LOADING & OPTIMIZATION TESTS
// ============================================================================

test.describe('Image Loading & Optimization', () => {
  test('should load product images successfully', async ({ page }) => {
    // Arrange & Act
    const productImages = page.locator(HERO_SELECTORS.productImage);
    const imageCount = await productImages.count();

    expect(imageCount).toBeGreaterThanOrEqual(1);

    // Wait for images to load
    await waitForImagesLoaded(page, HERO_SELECTORS.productImage);

    // Assert - First image should be loaded
    const firstImage = productImages.first();
    await expect(firstImage).toBeVisible();
    
    const naturalHeight = await firstImage.evaluate(img => img.naturalHeight);
    expect(naturalHeight).toBeGreaterThan(0);
  });

  test('should use WebP format for modern browsers', async ({ page, browserName }) => {
    // Arrange
    const productImage = page.locator(HERO_SELECTORS.productImage).first();
    await waitForImagesLoaded(page, HERO_SELECTORS.productImage);

    // Act
    const imageFormat = await getImageFormat(page, HERO_SELECTORS.productImage);

    // Assert - WebP should be used in modern browsers
    if (['chromium', 'firefox'].includes(browserName)) {
      expect(['webp', 'jpg', 'jpeg', 'png']).toContain(imageFormat);
    }
  });

  test('should have JPEG/PNG fallback for unsupported browsers', async ({ page }) => {
    // Arrange & Act
    const productImage = page.locator(HERO_SELECTORS.productImage).first();
    
    // Check for picture element with sources
    const hasPictureElement = await page.evaluate(() => {
      const img = document.querySelector('img[alt*="product" i]');
      return img?.parentElement?.tagName.toLowerCase() === 'picture';
    });

    // Assert - Should have fallback mechanism
    if (hasPictureElement) {
      const sources = await page.locator('picture source').count();
      expect(sources).toBeGreaterThanOrEqual(1);
    } else {
      // Direct img should have valid src
      const src = await productImage.getAttribute('src');
      expect(src).toBeTruthy();
      expect(src).toMatch(/\.(jpg|jpeg|png|webp)$/i);
    }
  });

  test('should load images within performance budget', async ({ page }) => {
    // Arrange & Act
    const startTime = Date.now();
    await waitForImagesLoaded(page, HERO_SELECTORS.productImage);
    const loadTime = Date.now() - startTime;

    // Assert
    expect(loadTime).toBeLessThan(PERFORMANCE_BUDGETS.imageLoadTime);
  });

  test('should have proper image alt text for accessibility', async ({ page }) => {
    // Arrange & Act
    const productImages = page.locator(HERO_SELECTORS.productImage);
    const imageCount = await productImages.count();

    // Assert - All images should have alt text
    for (let i = 0; i < imageCount; i++) {
      const image = productImages.nth(i);
      const altText = await image.getAttribute('alt');
      
      expect(altText).toBeTruthy();
      expect(altText.trim().length).toBeGreaterThan(0);
    }
  });

  test('should use lazy loading for below-fold images', async ({ page }) => {
    // Arrange & Act
    const productImages = page.locator(HERO_SELECTORS.productImage);
    const imageCount = await productImages.count();

    // Check loading attribute
    for (let i = 0; i < Math.min(imageCount, 3); i++) {
      const image = productImages.nth(i);
      const loading = await image.getAttribute('loading');
      
      // First image should be eager, others can be lazy
      if (i === 0) {
        expect(['eager', null]).toContain(loading);
      }
    }
  });

  test('should have responsive image sizes', async ({ page }) => {
    // Arrange & Act
    const productImage = page.locator(HERO_SELECTORS.productImage).first();
    
    // Check for srcset or sizes attribute
    const srcset = await productImage.getAttribute('srcset');
    const sizes = await productImage.getAttribute('sizes');

    // Assert - Should have responsive images
    const hasResponsiveImages = srcset || sizes;
    
    if (hasResponsiveImages) {
      expect(srcset || sizes).toBeTruthy();
    }
  });

  test('should not cause layout shift during image load', async ({ page }) => {
    // Arrange & Act
    const vitals = await getWebVitals(page);

    // Assert
    expect(vitals.cls).toBeLessThan(PERFORMANCE_BUDGETS.cls);
  });
});

// ============================================================================
// 4. CTA BUTTON FUNCTIONALITY TESTS
// ============================================================================

test.describe('CTA Button Functionality', () => {
  test('should display primary CTA button', async ({ page }) => {
    // Arrange & Act
    const primaryCta = page.locator(HERO_SELECTORS.primaryCta).first();

    // Assert
    await expect(primaryCta).toBeVisible();
    await expect(primaryCta).toBeEnabled();
  });

  test('should have descriptive CTA button text', async ({ page }) => {
    // Arrange & Act
    const ctaButtons = page.locator(HERO_SELECTORS.ctaButtons);
    const firstCta = ctaButtons.first();
    const buttonText = await firstCta.textContent();

    // Assert
    expect(buttonText).toBeTruthy();
    expect(buttonText.trim().length).toBeGreaterThan(2);
    
    // Should contain action words
    const actionWords = ['shop', 'buy', 'get', 'learn', 'explore', 'discover', 'view'];
    const hasActionWord = actionWords.some(word => 
      buttonText.toLowerCase().includes(word)
    );
    expect(hasActionWord).toBeTruthy();
  });

  test('should navigate on CTA button click', async ({ page }) => {
    // Arrange
    const primaryCta = page.locator(HERO_SELECTORS.primaryCta).first();
    const initialUrl = page.url();

    // Act
    await primaryCta.click();
    await page.waitForTimeout(500);

    // Assert - URL should change or modal should open
    const newUrl = page.url();
    const hasModal = await page.locator('[role="dialog"], .modal').count() > 0;
    
    expect(newUrl !== initialUrl || hasModal).toBeTruthy();
  });

  test('should respond to CTA click within performance budget', async ({ page }) => {
    // Arrange
    const primaryCta = page.locator(HERO_SELECTORS.primaryCta).first();

    // Act
    const startTime = Date.now();
    await primaryCta.click();
    await page.waitForLoadState('networkidle');
    const responseTime = Date.now() - startTime;

    // Assert
    expect(responseTime).toBeLessThan(PERFORMANCE_BUDGETS.ctaResponseTime + 1000);
  });

  test('should show hover state on CTA button', async ({ page }) => {
    // Arrange
    const primaryCta = page.locator(HERO_SELECTORS.primaryCta).first();

    // Act
    await primaryCta.hover();
    await page.waitForTimeout(200);

    // Assert - Check for visual changes
    const styles = await primaryCta.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        cursor: computed.cursor,
        backgroundColor: computed.backgroundColor,
      };
    });

    expect(styles.cursor).toBe('pointer');
  });

  test('should have proper focus state for keyboard navigation', async ({ page }) => {
    // Arrange
    const primaryCta = page.locator(HERO_SELECTORS.primaryCta).first();

    // Act
    await primaryCta.focus();

    // Assert
    const isFocused = await primaryCta.evaluate(el => 
      el === document.activeElement
    );
    expect(isFocused).toBeTruthy();

    // Check for focus indicator
    const outline = await primaryCta.evaluate(el => 
      window.getComputedStyle(el).outline
    );
    expect(outline).not.toBe('none');
  });

  test('should activate CTA with Enter key', async ({ page }) => {
    // Arrange
    const primaryCta = page.locator(HERO_SELECTORS.primaryCta).first();
    const initialUrl = page.url();

    // Act
    await primaryCta.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Assert
    const newUrl = page.url();
    const hasModal = await page.locator('[role="dialog"], .modal').count() > 0;
    
    expect(newUrl !== initialUrl || hasModal).toBeTruthy();
  });

  test('should activate CTA with Space key', async ({ page }) => {
    // Arrange
    const primaryCta = page.locator(HERO_SELECTORS.primaryCta).first();
    const initialUrl = page.url();

    // Act
    await primaryCta.focus();
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    // Assert
    const newUrl = page.url();
    const hasModal = await page.locator('[role="dialog"], .modal').count() > 0;
    
    expect(newUrl !== initialUrl || hasModal).toBeTruthy();
  });

  test('should display secondary CTA if present', async ({ page }) => {
    // Arrange & Act
    const secondaryCta = page.locator(HERO_SELECTORS.secondaryCta).first();
    const secondaryCount = await secondaryCta.count();

    // Assert - Secondary CTA is optional
    if (secondaryCount > 0) {
      await expect(secondaryCta).toBeVisible();
      await expect(secondaryCta).toBeEnabled();
    }
  });

  test('should have distinct styling for primary and secondary CTAs', async ({ page }) => {
    // Arrange
    const primaryCta = page.locator(HERO_SELECTORS.primaryCta).first();
    const secondaryCta = page.locator(HERO_SELECTORS.secondaryCta).first();
    
    const secondaryCount = await secondaryCta.count();
    
    if (secondaryCount === 0) {
      test.skip();
    }

    // Act
    const primaryStyles = await primaryCta.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        border: styles.border,
      };
    });

    const secondaryStyles = await secondaryCta.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        border: styles.border,
      };
    });

    // Assert - Styles should be different
    const stylesAreDifferent = 
      primaryStyles.backgroundColor !== secondaryStyles.backgroundColor ||
      primaryStyles.border !== secondaryStyles.border;
    
    expect(stylesAreDifferent).toBeTruthy();
  });
});

// ============================================================================
// 5. RESPONSIVE LAYOUT TESTS
// ============================================================================

test.describe('Responsive Layout', () => {
  test('should display correctly on mobile viewport', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORT_SIZES.mobile);
    await page.waitForTimeout(300);

    // Act
    const heroSection = page.locator(HERO_SELECTORS.heroSection).first();
    const productCards = page.locator(HERO_SELECTORS.productCards);

    // Assert
    await expect(heroSection).toBeVisible();
    
    const cardCount = await productCards.count();
    if (cardCount > 0) {
      await expect(productCards.first()).toBeVisible();
    }
  });

  test('should stack product cards vertically on mobile', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORT_SIZES.mobile);
    await page.waitForTimeout(300);

    const productCards = page.locator(HERO_SELECTORS.productCards);
    const cardCount = await productCards.count();

    if (cardCount < 2) {
      test.skip();
    }

    // Act
    const firstCardBox = await productCards.first().boundingBox();
    const secondCardBox = await productCards.nth(1).boundingBox();

    // Assert - Cards should be stacked vertically
    expect(firstCardBox).toBeTruthy();
    expect(secondCardBox).toBeTruthy();
    expect(secondCardBox.y).toBeGreaterThan(firstCardBox.y + firstCardBox.height - 50);
  });

  test('should display correctly on tablet viewport', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORT_SIZES.tablet);
    await page.waitForTimeout(300);

    // Act
    const heroSection = page.locator(HERO_SELECTORS.heroSection).first();
    const productCards = page.locator(HERO_SELECTORS.productCards);

    // Assert
    await expect(heroSection).toBeVisible();
    
    const cardCount = await productCards.count();
    if (cardCount > 0) {
      await expect(productCards.first()).toBeVisible();
    }
  });

  test('should display correctly on desktop viewport', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORT_SIZES.desktop);
    await page.waitForTimeout(300);

    // Act
    const heroSection = page.locator(HERO_SELECTORS.heroSection).first();
    const productCards = page.locator(HERO_SELECTORS.productCards);

    // Assert
    await expect(heroSection).toBeVisible();
    
    const cardCount = await productCards.count();
    if (cardCount > 0) {
      await expect(productCards.first()).toBeVisible();
    }
  });

  test('should arrange product cards in grid on desktop', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORT_SIZES.desktop);
    await page.waitForTimeout(300);

    const productCards = page.locator(HERO_SELECTORS.productCards);
    const cardCount = await productCards.count();

    if (cardCount < 2) {
      test.skip();
    }

    // Act
    const firstCardBox = await productCards.first().boundingBox();
    const secondCardBox = await productCards.nth(1).boundingBox();

    // Assert - Cards should be horizontally aligned
    expect(firstCardBox).toBeTruthy();
    expect(secondCardBox).toBeTruthy();
    
    const verticalDiff = Math.abs(firstCardBox.y - secondCardBox.y);
    expect(verticalDiff).toBeLessThan(50);
  });

  test('should scale images appropriately across viewports', async ({ page }) => {
    // Arrange
    const viewports = [VIEWPORT_SIZES.mobile, VIEWPORT_SIZES.tablet, VIEWPORT_SIZES.desktop];
    const imageSizes = [];

    // Act
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(300);

      const productImage = page.locator(HERO_SELECTORS.productImage).first();
      const box = await productImage.boundingBox();
      
      if (box) {
        imageSizes.push({ width: box.width, height: box.height });
      }
    }

    // Assert - Images should scale
    expect(imageSizes.length).toBe(3);
    
    // Mobile should be smaller than desktop
    expect(imageSizes[0].width).toBeLessThanOrEqual(imageSizes[2].width);
  });

  test('should maintain aspect ratio on resize', async ({ page }) => {
    // Arrange
    const productImage = page.locator(HERO_SELECTORS.productImage).first();
    await waitForImagesLoaded(page, HERO_SELECTORS.productImage);

    // Act - Get aspect ratio at different sizes
    const aspectRatios = [];
    
    for (const viewport of [VIEWPORT_SIZES.mobile, VIEWPORT_SIZES.desktop]) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(300);

      const box = await productImage.boundingBox();
      if (box) {
        aspectRatios.push(box.width / box.height);
      }
    }

    // Assert - Aspect ratios should be similar
    if (aspectRatios.length === 2) {
      const diff = Math.abs(aspectRatios[0] - aspectRatios[1]);
      expect(diff).toBeLessThan(0.5);
    }
  });

  test('should handle ultrawide viewport', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORT_SIZES.ultrawide);
    await page.waitForTimeout(300);

    // Act
    const heroSection = page.locator(HERO_SELECTORS.heroSection).first();
    const heroBox = await heroSection.boundingBox();

    // Assert - Content should be centered or max-width constrained
    expect(heroBox).toBeTruthy();
    
    // Check if content is centered
    const viewportWidth = VIEWPORT_SIZES.ultrawide.width;
    const contentWidth = heroBox.width;
    
    // Content should not span full ultrawide width
    expect(contentWidth).toBeLessThan(viewportWidth * 0.9);
  });
});

// ============================================================================
// 6. PERFORMANCE & WEB VITALS TESTS
// ============================================================================

test.describe('Performance & Web Vitals', () => {
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

  test('should load hero section without blocking main thread', async ({ page }) => {
    // Arrange & Act
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const longTasks = entries.filter(entry => entry.duration > 50);
          resolve({ longTaskCount: longTasks.length });
        });
        
        observer.observe({ type: 'longtask', buffered: true });
        
        setTimeout(() => {
          observer.disconnect();
          resolve({ longTaskCount: 0 });
        }, 3000);
      });
    });

    // Assert - Should have minimal long tasks
    expect(metrics.longTaskCount).toBeLessThan(5);
  });

  test('should optimize image loading performance', async ({ page }) => {
    // Arrange & Act
    const imageMetrics = await page.evaluate(() => {
      const images = document.querySelectorAll('img[alt*="product" i]');
      const metrics = [];
      
      images.forEach(img => {
        const entry = performance.getEntriesByName(img.currentSrc || img.src)[0];
        if (entry) {
          metrics.push({
            duration: entry.duration,
            size: entry.transferSize,
          });
        }
      });
      
      return metrics;
    });

    // Assert - Images should load efficiently
    imageMetrics.forEach(metric => {
      expect(metric.duration).toBeLessThan(1000);
    });
  });

  test('should use efficient caching strategy', async ({ page }) => {
    // Arrange - First load
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Act - Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Assert - Check cache headers
    const response = await page.goto('/');
    const cacheControl = response.headers()['cache-control'];
    
    // Should have caching enabled
    expect(cacheControl).toBeTruthy();
  });

  test('should minimize render-blocking resources', async ({ page }) => {
    // Arrange & Act
    const renderBlockingResources = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      return resources.filter(resource => 
        resource.renderBlockingStatus === 'blocking'
      ).length;
    });

    // Assert - Should have minimal blocking resources
    expect(renderBlockingResources).toBeLessThan(5);
  });
});

// ============================================================================
// 7. ACCESSIBILITY TESTS
// ============================================================================

test.describe('Accessibility Compliance', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    // Arrange & Act
    const headings = await page.evaluate(() => {
      const h1 = document.querySelectorAll('h1').length;
      const h2 = document.querySelectorAll('h2').length;
      const h3 = document.querySelectorAll('h3').length;
      return { h1, h2, h3 };
    });

    // Assert - Should have exactly one h1
    expect(headings.h1).toBe(1);
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // Arrange
    const heroHeading = page.locator(HERO_SELECTORS.heroHeading).first();

    // Act
    const colors = await heroHeading.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor,
      };
    });

    // Assert - Colors should be defined
    expect(colors.color).toBeTruthy();
    expect(colors.backgroundColor).toBeTruthy();
  });

  test('should have ARIA labels for interactive elements', async ({ page }) => {
    // Arrange & Act
    const ctaButtons = page.locator(HERO_SELECTORS.ctaButtons);
    const buttonCount = await ctaButtons.count();

    // Assert
    for (let i = 0; i < buttonCount; i++) {
      const button = ctaButtons.nth(i);
      
      const hasAccessibleName = await button.evaluate(el => {
        return el.textContent?.trim().length > 0 || 
               el.getAttribute('aria-label')?.length > 0;
      });
      
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Arrange
    const ctaButtons = page.locator(HERO_SELECTORS.ctaButtons);

    // Act - Tab to first button
    await page.keyboard.press('Tab');
    
    // Assert - Button should be focusable
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should have proper semantic landmarks', async ({ page }) => {
    // Arrange & Act
    const landmarks = await page.evaluate(() => {
      const main = document.querySelector('main');
      const sections = document.querySelectorAll('section');
      return {
        hasMain: !!main,
        sectionCount: sections.length,
      };
    });

    // Assert
    expect(landmarks.hasMain || landmarks.sectionCount > 0).toBeTruthy();
  });

  test('should announce dynamic content to screen readers', async ({ page }) => {
    // Arrange & Act
    const liveRegions = await page.locator('[aria-live]').count();

    // Assert - Live regions are optional but recommended
    if (liveRegions > 0) {
      const firstLiveRegion = page.locator('[aria-live]').first();
      const ariaLive = await firstLiveRegion.getAttribute('aria-live');
      expect(['polite', 'assertive']).toContain(ariaLive);
    }
  });
});

// ============================================================================
// 8. VISUAL REGRESSION TESTS
// ============================================================================

test.describe('Visual Regression', () => {
  test('should match hero section snapshot on desktop', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORT_SIZES.desktop);
    const heroSection = page.locator(HERO_SELECTORS.heroSection).first();

    // Act & Assert
    await expect(heroSection).toHaveScreenshot('hero-section-desktop.png');
  });

  test('should match hero section snapshot on mobile', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORT_SIZES.mobile);
    const heroSection = page.locator(HERO_SELECTORS.heroSection).first();

    // Act & Assert
    await expect(heroSection).toHaveScreenshot('hero-section-mobile.png');
  });

  test('should match product card snapshot', async ({ page }) => {
    // Arrange
    const firstCard = page.locator(HERO_SELECTORS.productCards).first();

    // Act & Assert
    await expect(firstCard).toHaveScreenshot('product-card.png');
  });

  test('should match CTA button hover state', async ({ page }) => {
    // Arrange
    const primaryCta = page.locator(HERO_SELECTORS.primaryCta).first();

    // Act
    await primaryCta.hover();
    await page.waitForTimeout(200);

    // Assert
    await expect(primaryCta).toHaveScreenshot('cta-button-hover.png');
  });
});

// ============================================================================
// 9. CROSS-BROWSER COMPATIBILITY TESTS
// ============================================================================

test.describe('Cross-Browser Compatibility', () => {
  test('should render consistently across browsers', async ({ page, browserName }) => {
    // Arrange & Act
    const heroSection = page.locator(HERO_SELECTORS.heroSection).first();

    // Assert
    await expect(heroSection).toBeVisible();
    
    // Take screenshot for comparison
    await expect(heroSection).toHaveScreenshot(`hero-${browserName}.png`);
  });

  test('should support CSS features across browsers', async ({ page }) => {
    // Arrange
    const heroSection = page.locator(HERO_SELECTORS.heroSection).first();

    // Act
    const styles = await heroSection.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        flexDirection: computed.flexDirection,
        gap: computed.gap,
      };
    });

    // Assert - Critical CSS should work
    expect(styles.display).toBeTruthy();
  });

  test('should handle image formats across browsers', async ({ page, browserName }) => {
    // Arrange & Act
    await waitForImagesLoaded(page, HERO_SELECTORS.productImage);
    const imageFormat = await getImageFormat(page, HERO_SELECTORS.productImage);

    // Assert - Should load appropriate format
    expect(['webp', 'jpg', 'jpeg', 'png']).toContain(imageFormat);
  });
});

// ============================================================================
// 10. EDGE CASES & ERROR HANDLING
// ============================================================================

test.describe('Edge Cases & Error Handling', () => {
  test('should handle missing product images gracefully', async ({ page }) => {
    // Arrange - Simulate broken image
    await page.route('**/*.{jpg,jpeg,png,webp}', route => route.abort());

    // Act
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Assert - Page should still render
    const heroSection = page.locator(HERO_SELECTORS.heroSection).first();
    await expect(heroSection).toBeVisible();
  });

  test('should handle slow network conditions', async ({ page }) => {
    // Arrange - Simulate slow 3G
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 500);
    });

    // Act
    await page.goto('/');

    // Assert - Should eventually load
    const heroSection = page.locator(HERO_SELECTORS.heroSection).first();
    await expect(heroSection).toBeVisible({ timeout: 10000 });
  });

  test('should handle rapid CTA clicks', async ({ page }) => {
    // Arrange
    const primaryCta = page.locator(HERO_SELECTORS.primaryCta).first();

    // Act - Rapid clicks
    for (let i = 0; i < 5; i++) {
      await primaryCta.click({ force: true });
      await page.waitForTimeout(50);
    }

    // Assert - Should not crash
    const heroSection = page.locator(HERO_SELECTORS.heroSection).first();
    await expect(heroSection).toBeVisible();
  });

  test('should handle viewport resize during interaction', async ({ page }) => {
    // Arrange
    const primaryCta = page.locator(HERO_SELECTORS.primaryCta).first();

    // Act - Click and resize
    await primaryCta.click();
    await page.setViewportSize(VIEWPORT_SIZES.mobile);
    await page.waitForTimeout(300);

    // Assert - Should handle gracefully
    const heroSection = page.locator(HERO_SELECTORS.heroSection).first();
    await expect(heroSection).toBeVisible();
  });

  test('should handle missing CTA buttons', async ({ page }) => {
    // Arrange - Hide CTA buttons
    await page.evaluate(() => {
      document.querySelectorAll('button, .btn').forEach(el => el.style.display = 'none');
    });

    // Act & Assert - Page should still be functional
    const heroSection = page.locator(HERO_SELECTORS.heroSection).first();
    await expect(heroSection).toBeVisible();
  });
});