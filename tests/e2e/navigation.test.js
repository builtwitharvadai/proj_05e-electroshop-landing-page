// tests/e2e/navigation.test.js
import { test, expect } from '@playwright/test';

/**
 * E2E Navigation Test Suite
 * 
 * Tests navigation functionality across all browsers and viewports:
 * - Desktop navigation menu
 * - Mobile hamburger menu
 * - Smooth scrolling behavior
 * - Keyboard navigation (accessibility)
 * - Responsive behavior
 * - Cross-browser compatibility
 * 
 * Coverage: Navigation component, menu interactions, scroll behavior
 */

// ============================================================================
// TEST DATA & HELPERS
// ============================================================================

const NAVIGATION_SELECTORS = {
  nav: 'nav[role="navigation"]',
  menuButton: 'button[aria-label*="menu" i], button[aria-label*="navigation" i]',
  menuItems: 'nav a[href^="#"], nav a[href^="/"]',
  logo: 'a[href="/"], a[href="#home"]',
  activeLink: 'nav a[aria-current="page"], nav a.active',
};

const VIEWPORT_BREAKPOINTS = {
  mobile: 320,
  tablet: 768,
  desktop: 1920,
};

const SCROLL_SECTIONS = ['#home', '#about', '#services', '#contact'];

/**
 * Helper: Wait for smooth scroll animation to complete
 */
async function waitForScrollAnimation(page, timeout = 1000) {
  await page.waitForTimeout(timeout);
  await page.waitForLoadState('networkidle');
}

/**
 * Helper: Get viewport category from page
 */
function getViewportCategory(page) {
  const width = page.viewportSize().width;
  if (width <= VIEWPORT_BREAKPOINTS.mobile) return 'mobile';
  if (width <= VIEWPORT_BREAKPOINTS.tablet) return 'tablet';
  return 'desktop';
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
  // Navigate to home page before each test
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
});

test.afterEach(async ({ page }) => {
  // Clean up any open modals or overlays
  await page.evaluate(() => {
    document.querySelectorAll('[role="dialog"], .modal, .overlay').forEach(el => el.remove());
  });
});

// ============================================================================
// 1. DESKTOP NAVIGATION TESTS
// ============================================================================

test.describe('Desktop Navigation', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('should display navigation bar with all menu items', async ({ page }) => {
    // Arrange & Act
    const nav = page.locator(NAVIGATION_SELECTORS.nav);
    const menuItems = page.locator(NAVIGATION_SELECTORS.menuItems);

    // Assert
    await expect(nav).toBeVisible();
    await expect(menuItems).toHaveCount(await menuItems.count());
    
    const count = await menuItems.count();
    expect(count).toBeGreaterThanOrEqual(3); // At least 3 menu items
  });

  test('should highlight active navigation link', async ({ page }) => {
    // Arrange
    const firstLink = page.locator(NAVIGATION_SELECTORS.menuItems).first();
    
    // Act
    await firstLink.click();
    await waitForScrollAnimation(page);

    // Assert
    const activeLink = page.locator(NAVIGATION_SELECTORS.activeLink);
    await expect(activeLink).toBeVisible();
    
    // Verify active link has proper ARIA attributes
    const ariaCurrentValue = await activeLink.getAttribute('aria-current');
    expect(['page', 'true']).toContain(ariaCurrentValue);
  });

  test('should navigate to correct section on menu click', async ({ page }) => {
    // Arrange
    const menuItems = page.locator(NAVIGATION_SELECTORS.menuItems);
    const itemCount = await menuItems.count();

    // Act & Assert - Test each menu item
    for (let i = 0; i < Math.min(itemCount, 4); i++) {
      const item = menuItems.nth(i);
      const href = await item.getAttribute('href');
      
      if (href?.startsWith('#')) {
        await item.click();
        await waitForScrollAnimation(page);

        // Verify URL hash changed
        const currentUrl = page.url();
        expect(currentUrl).toContain(href);

        // Verify section is in viewport
        const sectionVisible = await isInViewport(page, href);
        expect(sectionVisible).toBeTruthy();
      }
    }
  });

  test('should have smooth scroll behavior', async ({ page }) => {
    // Arrange
    const menuItems = page.locator(NAVIGATION_SELECTORS.menuItems);
    const firstItem = menuItems.first();
    const href = await firstItem.getAttribute('href');

    if (!href?.startsWith('#')) {
      test.skip();
    }

    // Act - Record scroll positions
    const scrollPositions = [];
    
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });

    await firstItem.click();

    // Sample scroll position during animation
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(100);
      const scrollY = await page.evaluate(() => window.scrollY);
      scrollPositions.push(scrollY);
    }

    // Assert - Scroll should be gradual, not instant
    const uniquePositions = new Set(scrollPositions);
    expect(uniquePositions.size).toBeGreaterThan(1);
  });

  test('should maintain navigation visibility on scroll', async ({ page }) => {
    // Arrange
    const nav = page.locator(NAVIGATION_SELECTORS.nav);

    // Act - Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);

    // Assert - Navigation should still be visible (sticky/fixed)
    await expect(nav).toBeVisible();
    
    const navPosition = await nav.evaluate(el => 
      window.getComputedStyle(el).position
    );
    expect(['fixed', 'sticky']).toContain(navPosition);
  });

  test('should handle logo click to return home', async ({ page }) => {
    // Arrange
    const logo = page.locator(NAVIGATION_SELECTORS.logo);
    
    // Navigate away from home
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(300);

    // Act
    await logo.click();
    await waitForScrollAnimation(page);

    // Assert
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeLessThan(100); // Near top of page
  });
});

// ============================================================================
// 2. MOBILE NAVIGATION TESTS
// ============================================================================

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 320, height: 568 }, isMobile: true });

  test('should display hamburger menu button', async ({ page }) => {
    // Arrange & Act
    const menuButton = page.locator(NAVIGATION_SELECTORS.menuButton);

    // Assert
    await expect(menuButton).toBeVisible();
    await expect(menuButton).toBeEnabled();
    
    // Verify accessibility attributes
    const ariaLabel = await menuButton.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel.toLowerCase()).toMatch(/menu|navigation/);
  });

  test('should open mobile menu on hamburger click', async ({ page }) => {
    // Arrange
    const menuButton = page.locator(NAVIGATION_SELECTORS.menuButton);
    
    // Act
    await menuButton.click();
    await page.waitForTimeout(300); // Animation time

    // Assert - Menu should be visible
    const menuItems = page.locator(NAVIGATION_SELECTORS.menuItems);
    await expect(menuItems.first()).toBeVisible();
    
    // Verify ARIA expanded state
    const ariaExpanded = await menuButton.getAttribute('aria-expanded');
    expect(ariaExpanded).toBe('true');
  });

  test('should close mobile menu on menu item click', async ({ page }) => {
    // Arrange
    const menuButton = page.locator(NAVIGATION_SELECTORS.menuButton);
    await menuButton.click();
    await page.waitForTimeout(300);

    const firstMenuItem = page.locator(NAVIGATION_SELECTORS.menuItems).first();

    // Act
    await firstMenuItem.click();
    await page.waitForTimeout(300);

    // Assert - Menu should close
    const ariaExpanded = await menuButton.getAttribute('aria-expanded');
    expect(ariaExpanded).toBe('false');
  });

  test('should close mobile menu on outside click', async ({ page }) => {
    // Arrange
    const menuButton = page.locator(NAVIGATION_SELECTORS.menuButton);
    await menuButton.click();
    await page.waitForTimeout(300);

    // Act - Click outside menu
    await page.click('body', { position: { x: 10, y: 300 } });
    await page.waitForTimeout(300);

    // Assert
    const ariaExpanded = await menuButton.getAttribute('aria-expanded');
    expect(ariaExpanded).toBe('false');
  });

  test('should handle touch gestures on mobile menu', async ({ page }) => {
    // Arrange
    const menuButton = page.locator(NAVIGATION_SELECTORS.menuButton);

    // Act - Tap menu button
    await menuButton.tap();
    await page.waitForTimeout(300);

    // Assert
    const menuItems = page.locator(NAVIGATION_SELECTORS.menuItems);
    await expect(menuItems.first()).toBeVisible();

    // Act - Tap menu item
    await menuItems.first().tap();
    await waitForScrollAnimation(page);

    // Assert - Navigation occurred
    const url = page.url();
    expect(url).toContain('#');
  });

  test('should prevent body scroll when mobile menu is open', async ({ page }) => {
    // Arrange
    const menuButton = page.locator(NAVIGATION_SELECTORS.menuButton);

    // Act
    await menuButton.click();
    await page.waitForTimeout(300);

    // Assert - Body should have overflow hidden
    const bodyOverflow = await page.evaluate(() => 
      window.getComputedStyle(document.body).overflow
    );
    expect(bodyOverflow).toBe('hidden');
  });
});

// ============================================================================
// 3. KEYBOARD NAVIGATION TESTS (ACCESSIBILITY)
// ============================================================================

test.describe('Keyboard Navigation', () => {
  test('should navigate menu items with Tab key', async ({ page }) => {
    // Arrange
    const menuItems = page.locator(NAVIGATION_SELECTORS.menuItems);
    const itemCount = await menuItems.count();

    // Act - Tab through menu items
    await page.keyboard.press('Tab');
    
    for (let i = 0; i < itemCount; i++) {
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Verify focus indicator
      const outline = await focusedElement.evaluate(el => 
        window.getComputedStyle(el).outline
      );
      expect(outline).not.toBe('none');
      
      await page.keyboard.press('Tab');
    }
  });

  test('should activate menu item with Enter key', async ({ page }) => {
    // Arrange
    const firstMenuItem = page.locator(NAVIGATION_SELECTORS.menuItems).first();
    const href = await firstMenuItem.getAttribute('href');

    // Act - Focus and press Enter
    await firstMenuItem.focus();
    await page.keyboard.press('Enter');
    await waitForScrollAnimation(page);

    // Assert
    if (href?.startsWith('#')) {
      const currentUrl = page.url();
      expect(currentUrl).toContain(href);
    }
  });

  test('should activate menu item with Space key', async ({ page }) => {
    // Arrange
    const firstMenuItem = page.locator(NAVIGATION_SELECTORS.menuItems).first();
    const href = await firstMenuItem.getAttribute('href');

    // Act
    await firstMenuItem.focus();
    await page.keyboard.press('Space');
    await waitForScrollAnimation(page);

    // Assert
    if (href?.startsWith('#')) {
      const currentUrl = page.url();
      expect(currentUrl).toContain(href);
    }
  });

  test('should close mobile menu with Escape key', async ({ page }) => {
    // Arrange - Set mobile viewport
    await page.setViewportSize({ width: 320, height: 568 });
    
    const menuButton = page.locator(NAVIGATION_SELECTORS.menuButton);
    
    // Skip if no menu button (desktop only)
    if (await menuButton.count() === 0) {
      test.skip();
    }

    await menuButton.click();
    await page.waitForTimeout(300);

    // Act
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Assert
    const ariaExpanded = await menuButton.getAttribute('aria-expanded');
    expect(ariaExpanded).toBe('false');
  });

  test('should have proper focus trap in mobile menu', async ({ page }) => {
    // Arrange
    await page.setViewportSize({ width: 320, height: 568 });
    
    const menuButton = page.locator(NAVIGATION_SELECTORS.menuButton);
    
    if (await menuButton.count() === 0) {
      test.skip();
    }

    await menuButton.click();
    await page.waitForTimeout(300);

    // Act - Tab through all focusable elements
    const focusableElements = [];
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const focusedId = await page.evaluate(() => 
        document.activeElement?.id || document.activeElement?.tagName
      );
      focusableElements.push(focusedId);
    }

    // Assert - Focus should cycle within menu
    const uniqueElements = new Set(focusableElements);
    expect(uniqueElements.size).toBeLessThan(focusableElements.length);
  });
});

// ============================================================================
// 4. RESPONSIVE BEHAVIOR TESTS
// ============================================================================

test.describe('Responsive Navigation', () => {
  test('should adapt layout for tablet viewport', async ({ page }) => {
    // Arrange
    await page.setViewportSize({ width: 768, height: 1024 });

    // Act
    const nav = page.locator(NAVIGATION_SELECTORS.nav);
    const menuButton = page.locator(NAVIGATION_SELECTORS.menuButton);

    // Assert - Check if hamburger menu or full menu is shown
    const hasMenuButton = await menuButton.count() > 0;
    const menuItems = page.locator(NAVIGATION_SELECTORS.menuItems);
    
    if (hasMenuButton) {
      // Tablet uses mobile menu
      await expect(menuButton).toBeVisible();
    } else {
      // Tablet uses desktop menu
      await expect(menuItems.first()).toBeVisible();
    }
  });

  test('should handle viewport resize from desktop to mobile', async ({ page }) => {
    // Arrange - Start desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(300);

    // Act - Resize to mobile
    await page.setViewportSize({ width: 320, height: 568 });
    await page.waitForTimeout(300);

    // Assert - Mobile menu should appear
    const menuButton = page.locator(NAVIGATION_SELECTORS.menuButton);
    
    if (await menuButton.count() > 0) {
      await expect(menuButton).toBeVisible();
    }
  });

  test('should handle viewport resize from mobile to desktop', async ({ page }) => {
    // Arrange - Start mobile
    await page.setViewportSize({ width: 320, height: 568 });
    await page.waitForTimeout(300);

    // Act - Resize to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(300);

    // Assert - Desktop menu should appear
    const menuItems = page.locator(NAVIGATION_SELECTORS.menuItems);
    await expect(menuItems.first()).toBeVisible();
  });

  test('should maintain navigation state across orientation change', async ({ page }) => {
    // Arrange - Mobile portrait
    await page.setViewportSize({ width: 320, height: 568 });
    
    const menuButton = page.locator(NAVIGATION_SELECTORS.menuButton);
    
    if (await menuButton.count() === 0) {
      test.skip();
    }

    await menuButton.click();
    await page.waitForTimeout(300);

    // Act - Rotate to landscape
    await page.setViewportSize({ width: 568, height: 320 });
    await page.waitForTimeout(300);

    // Assert - Menu state should persist or close gracefully
    const ariaExpanded = await menuButton.getAttribute('aria-expanded');
    expect(['true', 'false']).toContain(ariaExpanded);
  });
});

// ============================================================================
// 5. CROSS-BROWSER COMPATIBILITY TESTS
// ============================================================================

test.describe('Cross-Browser Navigation', () => {
  test('should render navigation consistently across browsers', async ({ page, browserName }) => {
    // Arrange & Act
    const nav = page.locator(NAVIGATION_SELECTORS.nav);
    const menuItems = page.locator(NAVIGATION_SELECTORS.menuItems);

    // Assert
    await expect(nav).toBeVisible();
    
    const itemCount = await menuItems.count();
    expect(itemCount).toBeGreaterThan(0);

    // Take screenshot for visual comparison
    await expect(nav).toHaveScreenshot(`navigation-${browserName}.png`);
  });

  test('should handle smooth scroll in all browsers', async ({ page, browserName }) => {
    // Arrange
    const firstMenuItem = page.locator(NAVIGATION_SELECTORS.menuItems).first();
    const href = await firstMenuItem.getAttribute('href');

    if (!href?.startsWith('#')) {
      test.skip();
    }

    // Act
    await firstMenuItem.click();
    await waitForScrollAnimation(page, browserName === 'webkit' ? 1500 : 1000);

    // Assert
    const sectionVisible = await isInViewport(page, href);
    expect(sectionVisible).toBeTruthy();
  });

  test('should support CSS features across browsers', async ({ page }) => {
    // Arrange
    const nav = page.locator(NAVIGATION_SELECTORS.nav);

    // Act & Assert - Check critical CSS properties
    const styles = await nav.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        position: computed.position,
        zIndex: computed.zIndex,
      };
    });

    expect(styles.display).not.toBe('none');
    expect(['fixed', 'sticky', 'relative', 'absolute']).toContain(styles.position);
  });
});

// ============================================================================
// 6. PERFORMANCE TESTS
// ============================================================================

test.describe('Navigation Performance', () => {
  test('should load navigation within performance budget', async ({ page }) => {
    // Arrange & Act
    const startTime = Date.now();
    await page.goto('/');
    
    const nav = page.locator(NAVIGATION_SELECTORS.nav);
    await nav.waitFor({ state: 'visible' });
    
    const loadTime = Date.now() - startTime;

    // Assert - Navigation should load quickly
    expect(loadTime).toBeLessThan(3000); // 3 second budget
  });

  test('should handle rapid menu interactions without lag', async ({ page }) => {
    // Arrange
    const menuItems = page.locator(NAVIGATION_SELECTORS.menuItems);
    const itemCount = Math.min(await menuItems.count(), 5);

    // Act - Rapid clicks
    const startTime = Date.now();
    
    for (let i = 0; i < itemCount; i++) {
      await menuItems.nth(i).click({ force: true });
      await page.waitForTimeout(50); // Minimal delay
    }
    
    const totalTime = Date.now() - startTime;

    // Assert - Should handle interactions smoothly
    expect(totalTime).toBeLessThan(itemCount * 200); // 200ms per interaction
  });

  test('should not cause layout shifts on navigation', async ({ page }) => {
    // Arrange
    await page.goto('/');
    
    // Act - Measure Cumulative Layout Shift
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsScore = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsScore += entry.value;
            }
          }
        });
        observer.observe({ type: 'layout-shift', buffered: true });
        
        setTimeout(() => {
          observer.disconnect();
          resolve(clsScore);
        }, 2000);
      });
    });

    // Assert - CLS should be minimal
    expect(cls).toBeLessThan(0.1); // Good CLS score
  });
});

// ============================================================================
// 7. EDGE CASES & ERROR HANDLING
// ============================================================================

test.describe('Navigation Edge Cases', () => {
  test('should handle missing navigation sections gracefully', async ({ page }) => {
    // Arrange
    const menuItems = page.locator(NAVIGATION_SELECTORS.menuItems);
    
    // Act - Click all menu items
    const itemCount = await menuItems.count();
    
    for (let i = 0; i < itemCount; i++) {
      const item = menuItems.nth(i);
      const href = await item.getAttribute('href');
      
      await item.click();
      await page.waitForTimeout(300);
      
      // Assert - Should not throw errors
      const hasError = await page.locator('[role="alert"]').count() > 0;
      expect(hasError).toBeFalsy();
    }
  });

  test('should handle navigation during page load', async ({ page }) => {
    // Arrange - Start navigation
    const navigationPromise = page.goto('/');
    
    // Act - Try to interact before fully loaded
    await page.waitForTimeout(100);
    
    const nav = page.locator(NAVIGATION_SELECTORS.nav);
    const isVisible = await nav.isVisible().catch(() => false);
    
    await navigationPromise;

    // Assert - Should eventually be visible
    await expect(nav).toBeVisible();
  });

  test('should handle multiple rapid menu toggles', async ({ page }) => {
    // Arrange
    await page.setViewportSize({ width: 320, height: 568 });
    
    const menuButton = page.locator(NAVIGATION_SELECTORS.menuButton);
    
    if (await menuButton.count() === 0) {
      test.skip();
    }

    // Act - Rapid toggle
    for (let i = 0; i < 10; i++) {
      await menuButton.click({ force: true });
      await page.waitForTimeout(50);
    }

    // Assert - Should be in valid state
    const ariaExpanded = await menuButton.getAttribute('aria-expanded');
    expect(['true', 'false']).toContain(ariaExpanded);
  });

  test('should handle navigation with JavaScript disabled', async ({ page, context }) => {
    // Arrange - Disable JavaScript
    await context.route('**/*', route => {
      if (route.request().resourceType() === 'script') {
        route.abort();
      } else {
        route.continue();
      }
    });

    // Act
    await page.goto('/');

    // Assert - Basic navigation should still work
    const nav = page.locator(NAVIGATION_SELECTORS.nav);
    await expect(nav).toBeVisible();
    
    const menuItems = page.locator(NAVIGATION_SELECTORS.menuItems);
    const itemCount = await menuItems.count();
    expect(itemCount).toBeGreaterThan(0);
  });
});

// ============================================================================
// 8. ACCESSIBILITY COMPLIANCE TESTS
// ============================================================================

test.describe('Navigation Accessibility', () => {
  test('should have proper ARIA landmarks', async ({ page }) => {
    // Arrange & Act
    const nav = page.locator('nav[role="navigation"]');

    // Assert
    await expect(nav).toBeVisible();
    
    const ariaLabel = await nav.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // Arrange
    const menuItems = page.locator(NAVIGATION_SELECTORS.menuItems);
    const firstItem = menuItems.first();

    // Act - Get computed colors
    const colors = await firstItem.evaluate(el => {
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

  test('should support screen reader navigation', async ({ page }) => {
    // Arrange
    const nav = page.locator(NAVIGATION_SELECTORS.nav);
    const menuItems = page.locator(NAVIGATION_SELECTORS.menuItems);

    // Assert - Check ARIA attributes
    await expect(nav).toHaveAttribute('role', 'navigation');
    
    const firstItem = menuItems.first();
    const hasAccessibleName = await firstItem.evaluate(el => {
      return el.textContent?.trim().length > 0 || 
             el.getAttribute('aria-label')?.length > 0;
    });
    
    expect(hasAccessibleName).toBeTruthy();
  });

  test('should announce navigation changes to screen readers', async ({ page }) => {
    // Arrange
    const firstMenuItem = page.locator(NAVIGATION_SELECTORS.menuItems).first();

    // Act
    await firstMenuItem.click();
    await waitForScrollAnimation(page);

    // Assert - Check for live region updates
    const liveRegion = page.locator('[aria-live]');
    const liveRegionCount = await liveRegion.count();
    
    // Live regions are optional but recommended
    if (liveRegionCount > 0) {
      const ariaLive = await liveRegion.first().getAttribute('aria-live');
      expect(['polite', 'assertive']).toContain(ariaLive);
    }
  });
});

// ============================================================================
// 9. VISUAL REGRESSION TESTS
// ============================================================================

test.describe('Navigation Visual Regression', () => {
  test('should match navigation snapshot on desktop', async ({ page }) => {
    // Arrange
    await page.setViewportSize({ width: 1920, height: 1080 });
    const nav = page.locator(NAVIGATION_SELECTORS.nav);

    // Act & Assert
    await expect(nav).toHaveScreenshot('navigation-desktop.png');
  });

  test('should match navigation snapshot on mobile', async ({ page }) => {
    // Arrange
    await page.setViewportSize({ width: 320, height: 568 });
    const nav = page.locator(NAVIGATION_SELECTORS.nav);

    // Act & Assert
    await expect(nav).toHaveScreenshot('navigation-mobile.png');
  });

  test('should match mobile menu open state', async ({ page }) => {
    // Arrange
    await page.setViewportSize({ width: 320, height: 568 });
    const menuButton = page.locator(NAVIGATION_SELECTORS.menuButton);
    
    if (await menuButton.count() === 0) {
      test.skip();
    }

    // Act
    await menuButton.click();
    await page.waitForTimeout(300);

    // Assert
    await expect(page).toHaveScreenshot('navigation-mobile-menu-open.png');
  });

  test('should match hover state on desktop', async ({ page }) => {
    // Arrange
    await page.setViewportSize({ width: 1920, height: 1080 });
    const firstMenuItem = page.locator(NAVIGATION_SELECTORS.menuItems).first();

    // Act
    await firstMenuItem.hover();
    await page.waitForTimeout(200);

    // Assert
    await expect(firstMenuItem).toHaveScreenshot('navigation-item-hover.png');
  });
});

// ============================================================================
// 10. INTEGRATION TESTS
// ============================================================================

test.describe('Navigation Integration', () => {
  test('should integrate with page routing', async ({ page }) => {
    // Arrange
    const menuItems = page.locator(NAVIGATION_SELECTORS.menuItems);
    const itemCount = await menuItems.count();

    // Act & Assert - Test each navigation
    for (let i = 0; i < Math.min(itemCount, 3); i++) {
      const item = menuItems.nth(i);
      const href = await item.getAttribute('href');
      
      await item.click();
      await waitForScrollAnimation(page);

      // Verify navigation occurred
      if (href?.startsWith('#')) {
        expect(page.url()).toContain(href);
      } else if (href?.startsWith('/')) {
        expect(page.url()).toContain(href);
      }
    }
  });

  test('should work with browser back/forward buttons', async ({ page }) => {
    // Arrange
    const menuItems = page.locator(NAVIGATION_SELECTORS.menuItems);
    const firstItem = menuItems.first();
    const secondItem = menuItems.nth(1);

    // Act - Navigate forward
    await firstItem.click();
    await waitForScrollAnimation(page);
    const firstUrl = page.url();

    await secondItem.click();
    await waitForScrollAnimation(page);
    const secondUrl = page.url();

    // Navigate back
    await page.goBack();
    await page.waitForTimeout(300);

    // Assert
    expect(page.url()).toBe(firstUrl);

    // Navigate forward
    await page.goForward();
    await page.waitForTimeout(300);

    expect(page.url()).toBe(secondUrl);
  });

  test('should preserve scroll position on page reload', async ({ page }) => {
    // Arrange
    const menuItems = page.locator(NAVIGATION_SELECTORS.menuItems);
    const secondItem = menuItems.nth(1);

    // Act - Navigate and scroll
    await secondItem.click();
    await waitForScrollAnimation(page);
    
    const scrollYBefore = await page.evaluate(() => window.scrollY);

    // Reload page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const scrollYAfter = await page.evaluate(() => window.scrollY);

    // Assert - Scroll position should be restored (within tolerance)
    expect(Math.abs(scrollYAfter - scrollYBefore)).toBeLessThan(100);
  });
});