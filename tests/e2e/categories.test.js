// tests/e2e/categories.test.js
import { test, expect } from '@playwright/test';

/**
 * E2E Categories Section Test Suite
 * 
 * Tests category grid functionality across all browsers and viewports:
 * - Category grid layout and responsive behavior
 * - Category card rendering and interactions
 * - Image lazy loading and optimization
 * - Category navigation and routing
 * - Hover effects and animations
 * - Keyboard accessibility
 * - Performance metrics
 * - Visual regression testing
 * - Cross-browser compatibility
 * 
 * Coverage: Categories section, category cards, grid layout, navigation, accessibility
 */

// ============================================================================
// TEST DATA & HELPERS
// ============================================================================

const CATEGORY_SELECTORS = {
  categoriesSection: '[data-testid="categories-section"], section.categories, .categories-section',
  categoriesHeading: '.categories-heading, .section-heading, h2',
  categoryGrid: '[data-testid="category-grid"], .category-grid, .categories-grid',
  categoryCards: '[data-testid="category-card"], .category-card',
  categoryImage: '.category-image img, .category-card img',
  categoryTitle: '.category-title, .category-name, h3',
  categoryDescription: '.category-description, .category-text',
  categoryLink: '.category-link, .category-card a',
  categoryCount: '.category-count, .product-count',
  categoryBadge: '.category-badge, .badge',
};

const VIEWPORT_SIZES = {
  mobile: { width: 375, height: 667 },
  mobileLarge: { width: 414, height: 896 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
  desktopLarge: { width: 1920, height: 1080 },
  ultrawide: { width: 2560, height: 1440 },
};

const PERFORMANCE_BUDGETS = {
  sectionLoadTime: 2000,
  imageLoadTime: 1500,
  navigationTime: 500,
  hoverResponseTime: 100,
  lcp: 2500,
  cls: 0.1,
  fid: 100,
};

const GRID_LAYOUTS = {
  mobile: { columns: 1, gap: 16 },
  tablet: { columns: 2, gap: 20 },
  desktop: { columns: 3, gap: 24 },
  desktopLarge: { columns: 4, gap: 24 },
};

/**
 * Helper: Wait for images to load with lazy loading support
 */
async function waitForImagesLoaded(page, selector, timeout = 5000) {
  await page.waitForFunction(
    (sel) => {
      const images = document.querySelectorAll(sel);
      return Array.from(images).every(img => {
        // Check if image is in viewport or already loaded
        const rect = img.getBoundingClientRect();
        const inViewport = rect.top < window.innerHeight && rect.bottom > 0;
        return !inViewport || (img.complete && img.naturalHeight > 0);
      });
    },
    selector,
    { timeout }
  );
}

/**
 * Helper: Scroll element into view and wait for lazy load
 */
async function scrollIntoViewAndWait(page, selector) {
  await page.locator(selector).first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(300); // Wait for lazy load trigger
  await waitForImagesLoaded(page, `${selector} img`);
}

/**
 * Helper: Get grid layout metrics
 */
async function getGridMetrics(page, gridSelector, cardSelector) {
  return await page.evaluate(
    ({ grid, card }) => {
      const gridEl = document.querySelector(grid);
      const cards = document.querySelectorAll(card);
      
      if (!gridEl || cards.length === 0) return null;
      
      const gridStyles = window.getComputedStyle(gridEl);
      const firstCard = cards[0];
      const secondCard = cards[1];
      
      const metrics = {
        columns: gridStyles.gridTemplateColumns?.split(' ').length || 0,
        gap: parseFloat(gridStyles.gap) || 0,
        cardCount: cards.length,
      };
      
      if (secondCard) {
        const firstRect = firstCard.getBoundingClientRect();
        const secondRect = secondCard.getBoundingClientRect();
        
        metrics.isHorizontal = Math.abs(firstRect.y - secondRect.y) < 50;
        metrics.isVertical = Math.abs(firstRect.x - secondRect.x) < 50;
        metrics.actualGap = metrics.isHorizontal 
          ? secondRect.left - firstRect.right
          : secondRect.top - firstRect.bottom;
      }
      
      return metrics;
    },
    { grid: gridSelector, card: cardSelector }
  );
}

/**
 * Helper: Check if element has hover effect
 */
async function hasHoverEffect(page, selector) {
  const beforeHover = await page.locator(selector).first().evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      transform: styles.transform,
      boxShadow: styles.boxShadow,
      opacity: styles.opacity,
      scale: styles.scale,
    };
  });
  
  await page.locator(selector).first().hover();
  await page.waitForTimeout(200);
  
  const afterHover = await page.locator(selector).first().evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      transform: styles.transform,
      boxShadow: styles.boxShadow,
      opacity: styles.opacity,
      scale: styles.scale,
    };
  });
  
  return (
    beforeHover.transform !== afterHover.transform ||
    beforeHover.boxShadow !== afterHover.boxShadow ||
    beforeHover.opacity !== afterHover.opacity ||
    beforeHover.scale !== afterHover.scale
  );
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
 * Helper: Check lazy loading implementation
 */
async function checkLazyLoading(page, imageSelector) {
  return await page.evaluate((sel) => {
    const images = document.querySelectorAll(sel);
    const lazyImages = Array.from(images).filter(img => {
      const loading = img.getAttribute('loading');
      const hasDataSrc = img.hasAttribute('data-src');
      const hasIntersectionObserver = img.classList.contains('lazy');
      
      return loading === 'lazy' || hasDataSrc || hasIntersectionObserver;
    });
    
    return {
      total: images.length,
      lazy: lazyImages.length,
      percentage: images.length > 0 ? (lazyImages.length / images.length) * 100 : 0,
    };
  }, imageSelector);
}

/**
 * Helper: Measure navigation performance
 */
async function measureNavigationTime(page, linkSelector) {
  const startTime = Date.now();
  
  await page.locator(linkSelector).first().click();
  await page.waitForLoadState('domcontentloaded');
  
  return Date.now() - startTime;
}

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

test.beforeEach(async ({ page }) => {
  // Navigate to home page
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  
  // Wait for categories section to be visible
  const categoriesSection = page.locator(CATEGORY_SELECTORS.categoriesSection).first();
  await categoriesSection.waitFor({ state: 'visible', timeout: 5000 });
  
  // Scroll to categories section
  await categoriesSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
});

test.afterEach(async ({ page }) => {
  // Clean up any modals or overlays
  await page.evaluate(() => {
    document.querySelectorAll('[role="dialog"], .modal, .overlay').forEach(el => el.remove());
  });
});

// ============================================================================
// 1. CATEGORIES SECTION RENDERING TESTS
// ============================================================================

test.describe('Categories Section Rendering', () => {
  test('should display categories section with all core elements', async ({ page }) => {
    // Arrange & Act
    const categoriesSection = page.locator(CATEGORY_SELECTORS.categoriesSection).first();
    const heading = page.locator(CATEGORY_SELECTORS.categoriesHeading).first();
    const categoryGrid = page.locator(CATEGORY_SELECTORS.categoryGrid).first();

    // Assert
    await expect(categoriesSection).toBeVisible();
    await expect(heading).toBeVisible();
    await expect(categoryGrid).toBeVisible();
  });

  test('should render section heading with descriptive text', async ({ page }) => {
    // Arrange & Act
    const heading = page.locator(CATEGORY_SELECTORS.categoriesHeading).first();
    const headingText = await heading.textContent();

    // Assert
    await expect(heading).toBeVisible();
    expect(headingText).toBeTruthy();
    expect(headingText.trim().length).toBeGreaterThan(3);
    
    // Should contain category-related keywords
    const categoryKeywords = ['categor', 'shop', 'browse', 'explore', 'collection'];
    const hasKeyword = categoryKeywords.some(keyword => 
      headingText.toLowerCase().includes(keyword)
    );
    expect(hasKeyword).toBeTruthy();
  });

  test('should have proper semantic HTML structure', async ({ page }) => {
    // Arrange & Act
    const categoriesSection = page.locator(CATEGORY_SELECTORS.categoriesSection).first();
    const heading = page.locator(CATEGORY_SELECTORS.categoriesHeading).first();

    // Assert
    const sectionTag = await categoriesSection.evaluate(el => el.tagName.toLowerCase());
    expect(['section', 'div']).toContain(sectionTag);

    const headingTag = await heading.evaluate(el => el.tagName.toLowerCase());
    expect(['h2', 'h3']).toContain(headingTag);
  });

  test('should load categories section within performance budget', async ({ page }) => {
    // Arrange
    const startTime = Date.now();

    // Act
    await page.locator(CATEGORY_SELECTORS.categoriesSection).first().waitFor({ 
      state: 'visible',
      timeout: 5000 
    });
    const loadTime = Date.now() - startTime;

    // Assert
    expect(loadTime).toBeLessThan(PERFORMANCE_BUDGETS.sectionLoadTime);
  });

  test('should display category grid container', async ({ page }) => {
    // Arrange & Act
    const categoryGrid = page.locator(CATEGORY_SELECTORS.categoryGrid).first();

    // Assert
    await expect(categoryGrid).toBeVisible();
    
    const gridStyles = await categoryGrid.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        gridTemplateColumns: styles.gridTemplateColumns,
      };
    });
    
    // Should use grid or flex layout
    expect(['grid', 'flex']).toContain(gridStyles.display);
  });
});

// ============================================================================
// 2. CATEGORY CARD RENDERING TESTS
// ============================================================================

test.describe('Category Card Rendering', () => {
  test('should display multiple category cards', async ({ page }) => {
    // Arrange & Act
    const categoryCards = page.locator(CATEGORY_SELECTORS.categoryCards);
    const cardCount = await categoryCards.count();

    // Assert
    expect(cardCount).toBeGreaterThanOrEqual(3);
    
    // Verify first three cards are visible
    for (let i = 0; i < Math.min(3, cardCount); i++) {
      await expect(categoryCards.nth(i)).toBeVisible();
    }
  });

  test('should render category card with all required elements', async ({ page }) => {
    // Arrange
    const firstCard = page.locator(CATEGORY_SELECTORS.categoryCards).first();

    // Act
    const hasImage = await firstCard.locator('img').count() > 0;
    const hasTitle = await firstCard.locator(CATEGORY_SELECTORS.categoryTitle).count() > 0;
    const hasLink = await firstCard.locator('a').count() > 0;

    // Assert
    expect(hasImage).toBeTruthy();
    expect(hasTitle).toBeTruthy();
    expect(hasLink).toBeTruthy();
  });

  test('should display category title with valid text', async ({ page }) => {
    // Arrange & Act
    const categoryTitle = page.locator(CATEGORY_SELECTORS.categoryTitle).first();
    const titleText = await categoryTitle.textContent();

    // Assert
    await expect(categoryTitle).toBeVisible();
    expect(titleText).toBeTruthy();
    expect(titleText.trim().length).toBeGreaterThan(2);
  });

  test('should display category image with proper attributes', async ({ page }) => {
    // Arrange & Act
    const categoryImage = page.locator(CATEGORY_SELECTORS.categoryImage).first();

    // Assert
    await expect(categoryImage).toBeVisible();
    
    const imageAttrs = await categoryImage.evaluate(img => ({
      src: img.src,
      alt: img.alt,
      loading: img.loading,
    }));
    
    expect(imageAttrs.src).toBeTruthy();
    expect(imageAttrs.alt).toBeTruthy();
    expect(imageAttrs.alt.trim().length).toBeGreaterThan(0);
  });

  test('should display category description if present', async ({ page }) => {
    // Arrange & Act
    const categoryDescription = page.locator(CATEGORY_SELECTORS.categoryDescription).first();
    const descriptionCount = await categoryDescription.count();

    // Assert - Description is optional
    if (descriptionCount > 0) {
      await expect(categoryDescription).toBeVisible();
      
      const descText = await categoryDescription.textContent();
      expect(descText.trim().length).toBeGreaterThan(0);
    }
  });

  test('should display product count if present', async ({ page }) => {
    // Arrange & Act
    const categoryCount = page.locator(CATEGORY_SELECTORS.categoryCount).first();
    const countExists = await categoryCount.count() > 0;

    // Assert - Count is optional
    if (countExists) {
      await expect(categoryCount).toBeVisible();
      
      const countText = await categoryCount.textContent();
      expect(countText).toMatch(/\d+/); // Contains number
    }
  });

  test('should have consistent card styling across all cards', async ({ page }) => {
    // Arrange
    const categoryCards = page.locator(CATEGORY_SELECTORS.categoryCards);
    const cardCount = await categoryCards.count();

    if (cardCount < 2) {
      test.skip();
    }

    // Act - Get styles of first two cards
    const firstCardStyles = await categoryCards.first().evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        padding: styles.padding,
        borderRadius: styles.borderRadius,
        backgroundColor: styles.backgroundColor,
        border: styles.border,
      };
    });

    const secondCardStyles = await categoryCards.nth(1).evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        padding: styles.padding,
        borderRadius: styles.borderRadius,
        backgroundColor: styles.backgroundColor,
        border: styles.border,
      };
    });

    // Assert - Cards should have consistent styling
    expect(firstCardStyles.padding).toBe(secondCardStyles.padding);
    expect(firstCardStyles.borderRadius).toBe(secondCardStyles.borderRadius);
  });

  test('should render category badges if present', async ({ page }) => {
    // Arrange & Act
    const categoryBadge = page.locator(CATEGORY_SELECTORS.categoryBadge).first();
    const badgeExists = await categoryBadge.count() > 0;

    // Assert - Badges are optional
    if (badgeExists) {
      await expect(categoryBadge).toBeVisible();
      
      const badgeText = await categoryBadge.textContent();
      expect(badgeText.trim().length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// 3. GRID LAYOUT & RESPONSIVE BEHAVIOR TESTS
// ============================================================================

test.describe('Grid Layout & Responsive Behavior', () => {
  test('should display single column grid on mobile', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORT_SIZES.mobile);
    await page.waitForTimeout(300);

    // Act
    const gridMetrics = await getGridMetrics(
      page,
      CATEGORY_SELECTORS.categoryGrid,
      CATEGORY_SELECTORS.categoryCards
    );

    // Assert
    expect(gridMetrics).toBeTruthy();
    expect(gridMetrics.cardCount).toBeGreaterThanOrEqual(1);
    
    // Should be single column or vertical stack
    if (gridMetrics.cardCount >= 2) {
      expect(gridMetrics.isVertical || gridMetrics.columns === 1).toBeTruthy();
    }
  });

  test('should display two column grid on tablet', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORT_SIZES.tablet);
    await page.waitForTimeout(300);

    // Act
    const gridMetrics = await getGridMetrics(
      page,
      CATEGORY_SELECTORS.categoryGrid,
      CATEGORY_SELECTORS.categoryCards
    );

    // Assert
    expect(gridMetrics).toBeTruthy();
    
    if (gridMetrics.cardCount >= 2) {
      // Should be 2 columns or horizontal layout
      expect(gridMetrics.columns === 2 || gridMetrics.isHorizontal).toBeTruthy();
    }
  });

  test('should display three or four column grid on desktop', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORT_SIZES.desktop);
    await page.waitForTimeout(300);

    // Act
    const gridMetrics = await getGridMetrics(
      page,
      CATEGORY_SELECTORS.categoryGrid,
      CATEGORY_SELECTORS.categoryCards
    );

    // Assert
    expect(gridMetrics).toBeTruthy();
    
    if (gridMetrics.cardCount >= 3) {
      // Should be 3 or 4 columns
      expect(gridMetrics.columns).toBeGreaterThanOrEqual(3);
      expect(gridMetrics.columns).toBeLessThanOrEqual(4);
    }
  });

  test('should maintain consistent gap between cards', async ({ page }) => {
    // Arrange & Act
    const gridMetrics = await getGridMetrics(
      page,
      CATEGORY_SELECTORS.categoryGrid,
      CATEGORY_SELECTORS.categoryCards
    );

    // Assert
    if (gridMetrics && gridMetrics.cardCount >= 2) {
      expect(gridMetrics.gap).toBeGreaterThan(0);
      expect(gridMetrics.actualGap).toBeGreaterThan(0);
      
      // Actual gap should be close to CSS gap
      const gapDifference = Math.abs(gridMetrics.gap - gridMetrics.actualGap);
      expect(gapDifference).toBeLessThan(10);
    }
  });

  test('should adapt grid layout on viewport resize', async ({ page }) => {
    // Arrange
    const viewports = [
      VIEWPORT_SIZES.mobile,
      VIEWPORT_SIZES.tablet,
      VIEWPORT_SIZES.desktop,
    ];
    
    const layouts = [];

    // Act
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(300);
      
      const metrics = await getGridMetrics(
        page,
        CATEGORY_SELECTORS.categoryGrid,
        CATEGORY_SELECTORS.categoryCards
      );
      
      if (metrics) {
        layouts.push(metrics.columns);
      }
    }

    // Assert - Columns should increase with viewport width
    expect(layouts.length).toBe(3);
    expect(layouts[2]).toBeGreaterThanOrEqual(layouts[0]);
  });

  test('should maintain card aspect ratio across viewports', async ({ page }) => {
    // Arrange
    const categoryCard = page.locator(CATEGORY_SELECTORS.categoryCards).first();
    const aspectRatios = [];

    // Act
    for (const viewport of [VIEWPORT_SIZES.mobile, VIEWPORT_SIZES.desktop]) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(300);

      const box = await categoryCard.boundingBox();
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

  test('should handle ultrawide viewport gracefully', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORT_SIZES.ultrawide);
    await page.waitForTimeout(300);

    // Act
    const categoryGrid = page.locator(CATEGORY_SELECTORS.categoryGrid).first();
    const gridBox = await categoryGrid.boundingBox();

    // Assert - Grid should be centered or max-width constrained
    expect(gridBox).toBeTruthy();
    
    const viewportWidth = VIEWPORT_SIZES.ultrawide.width;
    const gridWidth = gridBox.width;
    
    // Grid should not span full ultrawide width
    expect(gridWidth).toBeLessThan(viewportWidth * 0.9);
  });

  test('should align cards properly in grid', async ({ page }) => {
    // Arrange
    const categoryCards = page.locator(CATEGORY_SELECTORS.categoryCards);
    const cardCount = await categoryCards.count();

    if (cardCount < 2) {
      test.skip();
    }

    // Act
    const firstCardBox = await categoryCards.first().boundingBox();
    const secondCardBox = await categoryCards.nth(1).boundingBox();

    // Assert - Cards should be aligned
    expect(firstCardBox).toBeTruthy();
    expect(secondCardBox).toBeTruthy();
    
    // Check horizontal or vertical alignment
    const isHorizontal = Math.abs(firstCardBox.y - secondCardBox.y) < 50;
    const isVertical = Math.abs(firstCardBox.x - secondCardBox.x) < 50;
    
    expect(isHorizontal || isVertical).toBeTruthy();
  });
});

// ============================================================================
// 4. IMAGE LAZY LOADING TESTS
// ============================================================================

test.describe('Image Lazy Loading', () => {
  test('should implement lazy loading for category images', async ({ page }) => {
    // Arrange & Act
    const lazyLoadStats = await checkLazyLoading(page, CATEGORY_SELECTORS.categoryImage);

    // Assert
    expect(lazyLoadStats.total).toBeGreaterThan(0);
    
    // At least some images should use lazy loading
    expect(lazyLoadStats.lazy).toBeGreaterThan(0);
  });

  test('should load visible images immediately', async ({ page }) => {
    // Arrange
    const categoryCards = page.locator(CATEGORY_SELECTORS.categoryCards);
    const visibleCards = await categoryCards.evaluateAll(cards => {
      return cards.filter(card => {
        const rect = card.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
      }).length;
    });

    // Act
    await waitForImagesLoaded(page, CATEGORY_SELECTORS.categoryImage);

    // Assert - Visible images should be loaded
    for (let i = 0; i < visibleCards; i++) {
      const image = page.locator(CATEGORY_SELECTORS.categoryImage).nth(i);
      const naturalHeight = await image.evaluate(img => img.naturalHeight);
      expect(naturalHeight).toBeGreaterThan(0);
    }
  });

  test('should load images on scroll into view', async ({ page }) => {
    // Arrange
    const categoryCards = page.locator(CATEGORY_SELECTORS.categoryCards);
    const cardCount = await categoryCards.count();

    if (cardCount < 4) {
      test.skip();
    }

    // Act - Scroll to last card
    const lastCard = categoryCards.nth(cardCount - 1);
    await lastCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Assert - Last card image should be loaded
    const lastImage = lastCard.locator('img').first();
    const naturalHeight = await lastImage.evaluate(img => img.naturalHeight);
    expect(naturalHeight).toBeGreaterThan(0);
  });

  test('should load images within performance budget', async ({ page }) => {
    // Arrange
    const startTime = Date.now();

    // Act
    await waitForImagesLoaded(page, CATEGORY_SELECTORS.categoryImage);
    const loadTime = Date.now() - startTime;

    // Assert
    expect(loadTime).toBeLessThan(PERFORMANCE_BUDGETS.imageLoadTime);
  });

  test('should use appropriate image formats', async ({ page, browserName }) => {
    // Arrange & Act
    const categoryImage = page.locator(CATEGORY_SELECTORS.categoryImage).first();
    await waitForImagesLoaded(page, CATEGORY_SELECTORS.categoryImage);

    const imageFormat = await categoryImage.evaluate(img => {
      const src = img.currentSrc || img.src;
      return src.split('.').pop().split('?')[0].toLowerCase();
    });

    // Assert - Should use modern formats
    expect(['webp', 'jpg', 'jpeg', 'png', 'avif']).toContain(imageFormat);
  });

  test('should have proper alt text for all images', async ({ page }) => {
    // Arrange & Act
    const categoryImages = page.locator(CATEGORY_SELECTORS.categoryImage);
    const imageCount = await categoryImages.count();

    // Assert - All images should have alt text
    for (let i = 0; i < imageCount; i++) {
      const image = categoryImages.nth(i);
      const altText = await image.getAttribute('alt');
      
      expect(altText).toBeTruthy();
      expect(altText.trim().length).toBeGreaterThan(0);
    }
  });

  test('should not cause layout shift during image load', async ({ page }) => {
    // Arrange & Act
    const vitals = await getWebVitals(page);

    // Assert
    expect(vitals.cls).toBeLessThan(PERFORMANCE_BUDGETS.cls);
  });

  test('should have responsive image sizes', async ({ page }) => {
    // Arrange & Act
    const categoryImage = page.locator(CATEGORY_SELECTORS.categoryImage).first();
    
    const hasResponsiveImages = await categoryImage.evaluate(img => {
      return !!(img.srcset || img.sizes || img.parentElement?.tagName === 'PICTURE');
    });

    // Assert - Should support responsive images
    if (hasResponsiveImages) {
      const srcset = await categoryImage.getAttribute('srcset');
      const sizes = await categoryImage.getAttribute('sizes');
      
      expect(srcset || sizes).toBeTruthy();
    }
  });
});

// ============================================================================
// 5. CATEGORY NAVIGATION TESTS
// ============================================================================

test.describe('Category Navigation', () => {
  test('should navigate to category page on card click', async ({ page }) => {
    // Arrange
    const firstCard = page.locator(CATEGORY_SELECTORS.categoryCards).first();
    const initialUrl = page.url();

    // Act
    await firstCard.click();
    await page.waitForLoadState('domcontentloaded');

    // Assert - URL should change
    const newUrl = page.url();
    expect(newUrl).not.toBe(initialUrl);
  });

  test('should navigate on category link click', async ({ page }) => {
    // Arrange
    const categoryLink = page.locator(CATEGORY_SELECTORS.categoryLink).first();
    const initialUrl = page.url();

    // Act
    await categoryLink.click();
    await page.waitForLoadState('domcontentloaded');

    // Assert
    const newUrl = page.url();
    expect(newUrl).not.toBe(initialUrl);
  });

  test('should navigate within performance budget', async ({ page }) => {
    // Arrange
    const categoryLink = page.locator(CATEGORY_SELECTORS.categoryLink).first();

    // Act
    const navigationTime = await measureNavigationTime(page, CATEGORY_SELECTORS.categoryLink);

    // Assert
    expect(navigationTime).toBeLessThan(PERFORMANCE_BUDGETS.navigationTime + 1000);
  });

  test('should open category in same tab by default', async ({ page, context }) => {
    // Arrange
    const pagesBefore = context.pages().length;
    const categoryLink = page.locator(CATEGORY_SELECTORS.categoryLink).first();

    // Act
    await categoryLink.click();
    await page.waitForTimeout(500);

    // Assert
    const pagesAfter = context.pages().length;
    expect(pagesAfter).toBe(pagesBefore);
  });

  test('should have valid href attributes', async ({ page }) => {
    // Arrange & Act
    const categoryLinks = page.locator(CATEGORY_SELECTORS.categoryLink);
    const linkCount = await categoryLinks.count();

    // Assert
    for (let i = 0; i < Math.min(linkCount, 5); i++) {
      const link = categoryLinks.nth(i);
      const href = await link.getAttribute('href');
      
      expect(href).toBeTruthy();
      expect(href).not.toBe('#');
      expect(href.length).toBeGreaterThan(1);
    }
  });

  test('should support keyboard navigation with Enter key', async ({ page }) => {
    // Arrange
    const firstCard = page.locator(CATEGORY_SELECTORS.categoryCards).first();
    const initialUrl = page.url();

    // Act
    await firstCard.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Assert
    const newUrl = page.url();
    expect(newUrl).not.toBe(initialUrl);
  });

  test('should support keyboard navigation with Space key', async ({ page }) => {
    // Arrange
    const categoryLink = page.locator(CATEGORY_SELECTORS.categoryLink).first();
    const initialUrl = page.url();

    // Act
    await categoryLink.focus();
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    // Assert
    const newUrl = page.url();
    expect(newUrl).not.toBe(initialUrl);
  });

  test('should maintain scroll position on back navigation', async ({ page }) => {
    // Arrange
    await page.evaluate(() => window.scrollTo(0, 500));
    const scrollBefore = await page.evaluate(() => window.scrollY);
    
    const categoryLink = page.locator(CATEGORY_SELECTORS.categoryLink).first();

    // Act
    await categoryLink.click();
    await page.waitForLoadState('domcontentloaded');
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');

    // Assert - Scroll position should be restored
    const scrollAfter = await page.evaluate(() => window.scrollY);
    expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThan(100);
  });
});

// ============================================================================
// 6. HOVER EFFECTS & ANIMATIONS TESTS
// ============================================================================

test.describe('Hover Effects & Animations', () => {
  test('should display hover effect on category card', async ({ page }) => {
    // Arrange & Act
    const hasEffect = await hasHoverEffect(page, CATEGORY_SELECTORS.categoryCards);

    // Assert
    expect(hasEffect).toBeTruthy();
  });

  test('should show visual feedback on card hover', async ({ page }) => {
    // Arrange
    const firstCard = page.locator(CATEGORY_SELECTORS.categoryCards).first();

    // Act
    await firstCard.hover();
    await page.waitForTimeout(200);

    // Assert - Check for cursor change
    const cursor = await firstCard.evaluate(el => 
      window.getComputedStyle(el).cursor
    );
    expect(cursor).toBe('pointer');
  });

  test('should animate hover transition smoothly', async ({ page }) => {
    // Arrange
    const firstCard = page.locator(CATEGORY_SELECTORS.categoryCards).first();

    // Act
    const transition = await firstCard.evaluate(el => 
      window.getComputedStyle(el).transition
    );

    // Assert - Should have transition defined
    expect(transition).not.toBe('none');
    expect(transition).not.toBe('all 0s ease 0s');
  });

  test('should respond to hover within performance budget', async ({ page }) => {
    // Arrange
    const firstCard = page.locator(CATEGORY_SELECTORS.categoryCards).first();

    // Act
    const startTime = Date.now();
    await firstCard.hover();
    await page.waitForTimeout(100);
    const responseTime = Date.now() - startTime;

    // Assert
    expect(responseTime).toBeLessThan(PERFORMANCE_BUDGETS.hoverResponseTime + 100);
  });

  test('should scale or transform card on hover', async ({ page }) => {
    // Arrange
    const firstCard = page.locator(CATEGORY_SELECTORS.categoryCards).first();

    // Act
    const beforeTransform = await firstCard.evaluate(el => 
      window.getComputedStyle(el).transform
    );

    await firstCard.hover();
    await page.waitForTimeout(200);

    const afterTransform = await firstCard.evaluate(el => 
      window.getComputedStyle(el).transform
    );

    // Assert - Transform should change
    expect(beforeTransform !== afterTransform || afterTransform !== 'none').toBeTruthy();
  });

  test('should enhance image on card hover', async ({ page }) => {
    // Arrange
    const firstCard = page.locator(CATEGORY_SELECTORS.categoryCards).first();
    const cardImage = firstCard.locator('img').first();

    // Act
    const beforeStyles = await cardImage.evaluate(img => {
      const styles = window.getComputedStyle(img);
      return {
        transform: styles.transform,
        filter: styles.filter,
        opacity: styles.opacity,
      };
    });

    await firstCard.hover();
    await page.waitForTimeout(200);

    const afterStyles = await cardImage.evaluate(img => {
      const styles = window.getComputedStyle(img);
      return {
        transform: styles.transform,
        filter: styles.filter,
        opacity: styles.opacity,
      };
    });

    // Assert - Image should have some visual change
    const hasChange = 
      beforeStyles.transform !== afterStyles.transform ||
      beforeStyles.filter !== afterStyles.filter ||
      beforeStyles.opacity !== afterStyles.opacity;
    
    expect(hasChange).toBeTruthy();
  });

  test('should remove hover effect on mouse leave', async ({ page }) => {
    // Arrange
    const firstCard = page.locator(CATEGORY_SELECTORS.categoryCards).first();

    // Act
    const beforeHover = await firstCard.evaluate(el => 
      window.getComputedStyle(el).transform
    );

    await firstCard.hover();
    await page.waitForTimeout(200);

    await page.mouse.move(0, 0);
    await page.waitForTimeout(200);

    const afterLeave = await firstCard.evaluate(el => 
      window.getComputedStyle(el).transform
    );

    // Assert - Should return to original state
    expect(afterLeave).toBe(beforeHover);
  });

  test('should not cause layout shift on hover', async ({ page }) => {
    // Arrange
    const firstCard = page.locator(CATEGORY_SELECTORS.categoryCards).first();
    const secondCard = page.locator(CATEGORY_SELECTORS.categoryCards).nth(1);

    if (await secondCard.count() === 0) {
      test.skip();
    }

    // Act
    const secondCardPosBefore = await secondCard.boundingBox();
    
    await firstCard.hover();
    await page.waitForTimeout(200);
    
    const secondCardPosAfter = await secondCard.boundingBox();

    // Assert - Second card position should not change
    expect(secondCardPosBefore.x).toBe(secondCardPosAfter.x);
    expect(secondCardPosBefore.y).toBe(secondCardPosAfter.y);
  });
});

// ============================================================================
// 7. KEYBOARD ACCESSIBILITY TESTS
// ============================================================================

test.describe('Keyboard Accessibility', () => {
  test('should support Tab navigation through category cards', async ({ page }) => {
    // Arrange
    const categoryCards = page.locator(CATEGORY_SELECTORS.categoryCards);
    const cardCount = await categoryCards.count();

    // Act - Tab through cards
    for (let i = 0; i < Math.min(cardCount, 3); i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
    }

    // Assert - Should have focused element
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should show focus indicator on keyboard focus', async ({ page }) => {
    // Arrange
    const firstCard = page.locator(CATEGORY_SELECTORS.categoryCards).first();

    // Act
    await firstCard.focus();

    // Assert
    const isFocused = await firstCard.evaluate(el => 
      el === document.activeElement || el.contains(document.activeElement)
    );
    expect(isFocused).toBeTruthy();

    // Check for focus indicator
    const outline = await page.evaluate(() => {
      const focused = document.activeElement;
      return window.getComputedStyle(focused).outline;
    });
    expect(outline).not.toBe('none');
  });

  test('should activate category link with Enter key', async ({ page }) => {
    // Arrange
    const categoryLink = page.locator(CATEGORY_SELECTORS.categoryLink).first();
    const initialUrl = page.url();

    // Act
    await categoryLink.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Assert
    const newUrl = page.url();
    expect(newUrl).not.toBe(initialUrl);
  });

  test('should support Shift+Tab for reverse navigation', async ({ page }) => {
    // Arrange
    const categoryCards = page.locator(CATEGORY_SELECTORS.categoryCards);
    
    // Act - Tab forward then backward
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const forwardFocus = await page.evaluate(() => document.activeElement?.textContent);
    
    await page.keyboard.press('Shift+Tab');
    const backwardFocus = await page.evaluate(() => document.activeElement?.textContent);

    // Assert - Should move backward
    expect(forwardFocus).not.toBe(backwardFocus);
  });

  test('should have proper ARIA labels for category links', async ({ page }) => {
    // Arrange & Act
    const categoryLinks = page.locator(CATEGORY_SELECTORS.categoryLink);
    const linkCount = await categoryLinks.count();

    // Assert
    for (let i = 0; i < Math.min(linkCount, 3); i++) {
      const link = categoryLinks.nth(i);
      
      const hasAccessibleName = await link.evaluate(el => {
        const text = el.textContent?.trim();
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledBy = el.getAttribute('aria-labelledby');
        
        return (text && text.length > 0) || ariaLabel || ariaLabelledBy;
      });
      
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('should support keyboard navigation without mouse', async ({ page }) => {
    // Arrange
    const initialUrl = page.url();

    // Act - Navigate using only keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Assert - Should navigate successfully
    const newUrl = page.url();
    expect(newUrl).not.toBe(initialUrl);
  });

  test('should have logical tab order', async ({ page }) => {
    // Arrange
    const focusOrder = [];

    // Act - Tab through first 5 elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const focusedText = await page.evaluate(() => 
        document.activeElement?.textContent?.trim().substring(0, 20)
      );
      focusOrder.push(focusedText);
    }

    // Assert - Should have captured focus order
    expect(focusOrder.length).toBe(5);
    expect(focusOrder.filter(text => text && text.length > 0).length).toBeGreaterThan(0);
  });

  test('should skip to main content with skip link', async ({ page }) => {
    // Arrange & Act
    const skipLink = page.locator('a[href="#main"], a[href="#content"]').first();
    const skipLinkExists = await skipLink.count() > 0;

    // Assert - Skip link is optional but recommended
    if (skipLinkExists) {
      await skipLink.focus();
      await expect(skipLink).toBeVisible();
    }
  });
});

// ============================================================================
// 8. PERFORMANCE & WEB VITALS TESTS
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

  test('should meet First Input Delay (FID) budget', async ({ page }) => {
    // Arrange & Act
    const vitals = await getWebVitals(page);

    // Assert
    if (vitals.fid > 0) {
      expect(vitals.fid).toBeLessThan(PERFORMANCE_BUDGETS.fid);
    }
  });

  test('should load categories section without blocking main thread', async ({ page }) => {
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

    // Assert
    expect(metrics.longTaskCount).toBeLessThan(5);
  });

  test('should optimize image loading performance', async ({ page }) => {
    // Arrange & Act
    const imageMetrics = await page.evaluate(() => {
      const images = document.querySelectorAll('.category-image img, .category-card img');
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

    // Assert
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

    // Assert
    expect(renderBlockingResources).toBeLessThan(5);
  });

  test('should load efficiently on slow 3G network', async ({ page }) => {
    // Arrange - Simulate slow 3G
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 300);
    });

    // Act
    const startTime = Date.now();
    await page.goto('/');
    await page.locator(CATEGORY_SELECTORS.categoriesSection).first().waitFor({ 
      state: 'visible',
      timeout: 10000 
    });
    const loadTime = Date.now() - startTime;

    // Assert - Should load within reasonable time
    expect(loadTime).toBeLessThan(10000);
  });
});

// ============================================================================
// 9. VISUAL REGRESSION TESTS
// ============================================================================

test.describe('Visual Regression', () => {
  test('should match categories section snapshot on desktop', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORT_SIZES.desktop);
    const categoriesSection = page.locator(CATEGORY_SELECTORS.categoriesSection).first();

    // Act & Assert
    await expect(categoriesSection).toHaveScreenshot('categories-section-desktop.png');
  });

  test('should match categories section snapshot on mobile', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORT_SIZES.mobile);
    const categoriesSection = page.locator(CATEGORY_SELECTORS.categoriesSection).first();

    // Act & Assert
    await expect(categoriesSection).toHaveScreenshot('categories-section-mobile.png');
  });

  test('should match category card snapshot', async ({ page }) => {
    // Arrange
    const firstCard = page.locator(CATEGORY_SELECTORS.categoryCards).first();

    // Act & Assert
    await expect(firstCard).toHaveScreenshot('category-card.png');
  });

  test('should match category card hover state', async ({ page }) => {
    // Arrange
    const firstCard = page.locator(CATEGORY_SELECTORS.categoryCards).first();

    // Act
    await firstCard.hover();
    await page.waitForTimeout(200);

    // Assert
    await expect(firstCard).toHaveScreenshot('category-card-hover.png');
  });

  test('should match grid layout on tablet', async ({ page }) => {
    // Arrange
    await page.setViewportSize(VIEWPORT_SIZES.tablet);
    const categoryGrid = page.locator(CATEGORY_SELECTORS.categoryGrid).first();

    // Act & Assert
    await expect(categoryGrid).toHaveScreenshot('category-grid-tablet.png');
  });
});

// ============================================================================
// 10. CROSS-BROWSER COMPATIBILITY TESTS
// ============================================================================

test.describe('Cross-Browser Compatibility', () => {
  test('should render consistently across browsers', async ({ page, browserName }) => {
    // Arrange & Act
    const categoriesSection = page.locator(CATEGORY_SELECTORS.categoriesSection).first();

    // Assert
    await expect(categoriesSection).toBeVisible();
    
    // Take screenshot for comparison
    await expect(categoriesSection).toHaveScreenshot(`categories-${browserName}.png`);
  });

  test('should support CSS Grid across browsers', async ({ page }) => {
    // Arrange
    const categoryGrid = page.locator(CATEGORY_SELECTORS.categoryGrid).first();

    // Act
    const gridSupport = await categoryGrid.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        gridTemplateColumns: styles.gridTemplateColumns,
      };
    });

    // Assert
    expect(['grid', 'flex']).toContain(gridSupport.display);
  });

  test('should handle image formats across browsers', async ({ page, browserName }) => {
    // Arrange & Act
    await waitForImagesLoaded(page, CATEGORY_SELECTORS.categoryImage);
    
    const categoryImage = page.locator(CATEGORY_SELECTORS.categoryImage).first();
    const imageFormat = await categoryImage.evaluate(img => {
      const src = img.currentSrc || img.src;
      return src.split('.').pop().split('?')[0].toLowerCase();
    });

    // Assert
    expect(['webp', 'jpg', 'jpeg', 'png', 'avif']).toContain(imageFormat);
  });

  test('should support hover effects across browsers', async ({ page }) => {
    // Arrange & Act
    const hasEffect = await hasHoverEffect(page, CATEGORY_SELECTORS.categoryCards);

    // Assert
    expect(hasEffect).toBeTruthy();
  });
});

// ============================================================================
// 11. EDGE CASES & ERROR HANDLING
// ============================================================================

test.describe('Edge Cases & Error Handling', () => {
  test('should handle missing category images gracefully', async ({ page }) => {
    // Arrange - Simulate broken images
    await page.route('**/*.{jpg,jpeg,png,webp}', route => route.abort());

    // Act
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Assert - Section should still render
    const categoriesSection = page.locator(CATEGORY_SELECTORS.categoriesSection).first();
    await expect(categoriesSection).toBeVisible();
  });

  test('should handle slow network conditions', async ({ page }) => {
    // Arrange - Simulate slow network
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 500);
    });

    // Act
    await page.goto('/');

    // Assert - Should eventually load
    const categoriesSection = page.locator(CATEGORY_SELECTORS.categoriesSection).first();
    await expect(categoriesSection).toBeVisible({ timeout: 10000 });
  });

  test('should handle rapid card clicks', async ({ page }) => {
    // Arrange
    const firstCard = page.locator(CATEGORY_SELECTORS.categoryCards).first();

    // Act - Rapid clicks
    for (let i = 0; i < 5; i++) {
      await firstCard.click({ force: true });
      await page.waitForTimeout(50);
    }

    // Assert - Should not crash
    const categoriesSection = page.locator(CATEGORY_SELECTORS.categoriesSection).first();
    await expect(categoriesSection).toBeVisible();
  });

  test('should handle viewport resize during interaction', async ({ page }) => {
    // Arrange
    const firstCard = page.locator(CATEGORY_SELECTORS.categoryCards).first();

    // Act - Hover and resize
    await firstCard.hover();
    await page.setViewportSize(VIEWPORT_SIZES.mobile);
    await page.waitForTimeout(300);

    // Assert - Should handle gracefully
    const categoriesSection = page.locator(CATEGORY_SELECTORS.categoriesSection).first();
    await expect(categoriesSection).toBeVisible();
  });

  test('should handle empty category grid', async ({ page }) => {
    // Arrange - Hide all cards
    await page.evaluate(() => {
      document.querySelectorAll('.category-card').forEach(el => el.style.display = 'none');
    });

    // Act & Assert - Section should still be visible
    const categoriesSection = page.locator(CATEGORY_SELECTORS.categoriesSection).first();
    await expect(categoriesSection).toBeVisible();
  });

  test('should handle missing category titles', async ({ page }) => {
    // Arrange - Remove titles
    await page.evaluate(() => {
      document.querySelectorAll('.category-title').forEach(el => el.remove());
    });

    // Act & Assert - Cards should still be visible
    const categoryCards = page.locator(CATEGORY_SELECTORS.categoryCards);
    await expect(categoryCards.first()).toBeVisible();
  });

  test('should handle long category names', async ({ page }) => {
    // Arrange - Add long text
    await page.evaluate(() => {
      const title = document.querySelector('.category-title');
      if (title) {
        title.textContent = 'Very Long Category Name That Should Be Handled Properly Without Breaking Layout';
      }
    });

    // Act & Assert - Should not break layout
    const firstCard = page.locator(CATEGORY_SELECTORS.categoryCards).first();
    const cardBox = await firstCard.boundingBox();
    
    expect(cardBox).toBeTruthy();
    expect(cardBox.height).toBeLessThan(1000); // Should not be excessively tall
  });

  test('should handle simultaneous hover on multiple cards', async ({ page }) => {
    // Arrange
    const categoryCards = page.locator(CATEGORY_SELECTORS.categoryCards);
    const cardCount = await categoryCards.count();

    if (cardCount < 2) {
      test.skip();
    }

    // Act - Hover multiple cards quickly
    for (let i = 0; i < Math.min(cardCount, 3); i++) {
      await categoryCards.nth(i).hover();
      await page.waitForTimeout(50);
    }

    // Assert - Should handle gracefully
    const categoriesSection = page.locator(CATEGORY_SELECTORS.categoriesSection).first();
    await expect(categoriesSection).toBeVisible();
  });
});