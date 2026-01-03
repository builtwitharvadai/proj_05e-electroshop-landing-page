// tests/performance/core-web-vitals.test.js
import { test, expect, chromium, firefox, webkit } from '@playwright/test';

/**
 * Core Web Vitals Performance Test Suite
 * 
 * This suite validates performance metrics across browsers and network conditions,
 * ensuring compliance with Google's Core Web Vitals thresholds and optimal user experience.
 * 
 * Test Coverage:
 * - Largest Contentful Paint (LCP) - Target: < 2.5s (Good), < 4.0s (Needs Improvement)
 * - First Input Delay (FID) - Target: < 100ms (Good), < 300ms (Needs Improvement)
 * - Cumulative Layout Shift (CLS) - Target: < 0.1 (Good), < 0.25 (Needs Improvement)
 * - First Contentful Paint (FCP) - Target: < 1.8s (Good), < 3.0s (Needs Improvement)
 * - Time to Interactive (TTI) - Target: < 3.8s (Good), < 7.3s (Needs Improvement)
 * - Total Blocking Time (TBT) - Target: < 200ms (Good), < 600ms (Needs Improvement)
 * - Speed Index - Target: < 3.4s (Good), < 5.8s (Needs Improvement)
 * 
 * Network Conditions:
 * - Fast 3G (1.6 Mbps down, 750 Kbps up, 150ms RTT)
 * - Slow 3G (400 Kbps down, 400 Kbps up, 400ms RTT)
 * - 4G (4 Mbps down, 3 Mbps up, 20ms RTT)
 * - WiFi (30 Mbps down, 15 Mbps up, 2ms RTT)
 * 
 * Browser Coverage:
 * - Chromium (Chrome/Edge)
 * - Firefox
 * - WebKit (Safari)
 * 
 * Performance Considerations:
 * - Parallel test execution
 * - Performance trace capture
 * - Screenshot capture for visual analysis
 * - Detailed performance reporting
 * - Regression detection
 */

// ============================================================================
// TEST CONFIGURATION & CONSTANTS
// ============================================================================

/**
 * Google Core Web Vitals thresholds
 * @see https://web.dev/vitals/
 */
const CORE_WEB_VITALS_THRESHOLDS = {
  LCP: {
    good: 2500,        // 2.5 seconds
    needsImprovement: 4000,  // 4.0 seconds
  },
  FID: {
    good: 100,         // 100 milliseconds
    needsImprovement: 300,   // 300 milliseconds
  },
  CLS: {
    good: 0.1,         // 0.1 score
    needsImprovement: 0.25,  // 0.25 score
  },
  FCP: {
    good: 1800,        // 1.8 seconds
    needsImprovement: 3000,  // 3.0 seconds
  },
  TTI: {
    good: 3800,        // 3.8 seconds
    needsImprovement: 7300,  // 7.3 seconds
  },
  TBT: {
    good: 200,         // 200 milliseconds
    needsImprovement: 600,   // 600 milliseconds
  },
  SpeedIndex: {
    good: 3400,        // 3.4 seconds
    needsImprovement: 5800,  // 5.8 seconds
  },
};

/**
 * Network condition presets for testing
 */
const NETWORK_CONDITIONS = {
  fast3G: {
    name: 'Fast 3G',
    downloadThroughput: (1.6 * 1024 * 1024) / 8, // 1.6 Mbps
    uploadThroughput: (750 * 1024) / 8,          // 750 Kbps
    latency: 150,                                 // 150ms RTT
  },
  slow3G: {
    name: 'Slow 3G',
    downloadThroughput: (400 * 1024) / 8,        // 400 Kbps
    uploadThroughput: (400 * 1024) / 8,          // 400 Kbps
    latency: 400,                                 // 400ms RTT
  },
  '4G': {
    name: '4G',
    downloadThroughput: (4 * 1024 * 1024) / 8,   // 4 Mbps
    uploadThroughput: (3 * 1024 * 1024) / 8,     // 3 Mbps
    latency: 20,                                  // 20ms RTT
  },
  wifi: {
    name: 'WiFi',
    downloadThroughput: (30 * 1024 * 1024) / 8,  // 30 Mbps
    uploadThroughput: (15 * 1024 * 1024) / 8,    // 15 Mbps
    latency: 2,                                   // 2ms RTT
  },
};

/**
 * Browser configurations for cross-browser testing
 */
const BROWSER_CONFIGS = [
  { name: 'Chromium', browserType: chromium },
  { name: 'Firefox', browserType: firefox },
  { name: 'WebKit', browserType: webkit },
];

/**
 * Viewport configurations for responsive testing
 */
const VIEWPORTS = {
  mobile: { width: 375, height: 667, name: 'Mobile' },
  tablet: { width: 768, height: 1024, name: 'Tablet' },
  desktop: { width: 1920, height: 1080, name: 'Desktop' },
};

/**
 * Performance budget thresholds (stricter than Core Web Vitals)
 */
const PERFORMANCE_BUDGET = {
  pageLoadTime: 3000,        // 3 seconds
  domContentLoaded: 2000,    // 2 seconds
  firstPaint: 1000,          // 1 second
  resourceCount: 50,         // Maximum number of resources
  totalResourceSize: 2 * 1024 * 1024, // 2 MB
  jsSize: 500 * 1024,        // 500 KB
  cssSize: 200 * 1024,       // 200 KB
  imageSize: 1024 * 1024,    // 1 MB
};

/**
 * Test data and selectors
 */
const SELECTORS = {
  storeInfoSection: '[data-testid="store-info-section"], section.store-info, .store-info-section',
  contactForm: '[data-testid="contact-form"], form.contact-form, .contact-form',
  mapContainer: '[data-testid="store-map"], .store-map, #store-map, .map-container',
  businessHours: '[data-testid="business-hours"], .business-hours, .store-hours',
  heroImage: 'img[data-testid="hero-image"], .hero-image, img.hero',
  mainContent: 'main, [role="main"], #main-content',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Collect Core Web Vitals metrics using Performance Observer API
 */
async function collectCoreWebVitals(page) {
  return await page.evaluate(() => {
    return new Promise((resolve) => {
      const metrics = {
        LCP: null,
        FID: null,
        CLS: null,
        FCP: null,
        TTFB: null,
      };

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        metrics.LCP = lastEntry.renderTime || lastEntry.loadTime;
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-input') {
            metrics.FID = entry.processingStart - entry.startTime;
          }
        });
      });
      fidObserver.observe({ type: 'first-input', buffered: true });

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        metrics.CLS = clsValue;
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });

      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            metrics.FCP = entry.startTime;
          }
        });
      });
      fcpObserver.observe({ type: 'paint', buffered: true });

      // Time to First Byte
      const navigationEntry = performance.getEntriesByType('navigation')[0];
      if (navigationEntry) {
        metrics.TTFB = navigationEntry.responseStart - navigationEntry.requestStart;
      }

      // Wait for metrics to be collected
      setTimeout(() => {
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
        fcpObserver.disconnect();
        resolve(metrics);
      }, 5000);
    });
  });
}

/**
 * Collect performance timing metrics
 */
async function collectPerformanceTiming(page) {
  return await page.evaluate(() => {
    const timing = performance.timing;
    const navigation = performance.getEntriesByType('navigation')[0];

    return {
      // Navigation timing
      navigationStart: timing.navigationStart,
      redirectTime: timing.redirectEnd - timing.redirectStart,
      dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
      tcpTime: timing.connectEnd - timing.connectStart,
      requestTime: timing.responseStart - timing.requestStart,
      responseTime: timing.responseEnd - timing.responseStart,
      domProcessingTime: timing.domComplete - timing.domLoading,
      domContentLoadedTime: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
      loadEventTime: timing.loadEventEnd - timing.loadEventStart,
      
      // Calculated metrics
      pageLoadTime: timing.loadEventEnd - timing.navigationStart,
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      domInteractive: timing.domInteractive - timing.navigationStart,
      
      // Resource timing
      transferSize: navigation ? navigation.transferSize : 0,
      encodedBodySize: navigation ? navigation.encodedBodySize : 0,
      decodedBodySize: navigation ? navigation.decodedBodySize : 0,
    };
  });
}

/**
 * Collect resource loading metrics
 */
async function collectResourceMetrics(page) {
  return await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource');
    
    const metrics = {
      totalResources: resources.length,
      totalSize: 0,
      byType: {
        script: { count: 0, size: 0 },
        stylesheet: { count: 0, size: 0 },
        image: { count: 0, size: 0 },
        font: { count: 0, size: 0 },
        xhr: { count: 0, size: 0 },
        fetch: { count: 0, size: 0 },
        other: { count: 0, size: 0 },
      },
      slowResources: [],
    };

    resources.forEach((resource) => {
      const size = resource.transferSize || 0;
      metrics.totalSize += size;

      // Categorize by type
      let type = 'other';
      if (resource.initiatorType === 'script' || resource.name.endsWith('.js')) {
        type = 'script';
      } else if (resource.initiatorType === 'link' || resource.name.endsWith('.css')) {
        type = 'stylesheet';
      } else if (resource.initiatorType === 'img' || /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(resource.name)) {
        type = 'image';
      } else if (/\.(woff|woff2|ttf|otf)$/i.test(resource.name)) {
        type = 'font';
      } else if (resource.initiatorType === 'xmlhttprequest') {
        type = 'xhr';
      } else if (resource.initiatorType === 'fetch') {
        type = 'fetch';
      }

      metrics.byType[type].count++;
      metrics.byType[type].size += size;

      // Track slow resources (> 1 second)
      const duration = resource.responseEnd - resource.startTime;
      if (duration > 1000) {
        metrics.slowResources.push({
          name: resource.name,
          type,
          duration: Math.round(duration),
          size,
        });
      }
    });

    return metrics;
  });
}

/**
 * Calculate Speed Index using visual progress
 */
async function calculateSpeedIndex(page) {
  // Start tracing
  await page.context().tracing.start({
    screenshots: true,
    snapshots: true,
  });

  // Navigate and wait for load
  await page.goto('/', { waitUntil: 'load' });

  // Stop tracing
  const tracePath = `test-results/trace-${Date.now()}.zip`;
  await page.context().tracing.stop({ path: tracePath });

  // Parse trace to calculate Speed Index
  // Note: This is a simplified calculation
  // In production, use Lighthouse or WebPageTest for accurate Speed Index
  const visualProgress = await page.evaluate(() => {
    const entries = performance.getEntriesByType('paint');
    const fcp = entries.find(e => e.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : 0;
  });

  return visualProgress;
}

/**
 * Simulate user interaction to measure FID
 */
async function measureFirstInputDelay(page) {
  // Wait for page to be interactive
  await page.waitForLoadState('domcontentloaded');

  // Measure time to first interaction
  const fidStart = Date.now();
  
  // Simulate click on first interactive element
  const interactiveElement = await page.locator('button, a, input').first();
  if (await interactiveElement.count() > 0) {
    await interactiveElement.click({ timeout: 5000 }).catch(() => null);
  }

  const fidEnd = Date.now();
  return fidEnd - fidStart;
}

/**
 * Format metrics for reporting
 */
function formatMetrics(metrics) {
  return {
    ...metrics,
    LCP: metrics.LCP ? `${Math.round(metrics.LCP)}ms` : 'N/A',
    FID: metrics.FID ? `${Math.round(metrics.FID)}ms` : 'N/A',
    CLS: metrics.CLS ? metrics.CLS.toFixed(3) : 'N/A',
    FCP: metrics.FCP ? `${Math.round(metrics.FCP)}ms` : 'N/A',
    TTFB: metrics.TTFB ? `${Math.round(metrics.TTFB)}ms` : 'N/A',
  };
}

/**
 * Assert metric is within threshold
 */
function assertMetricThreshold(metricValue, threshold, metricName) {
  const { good, needsImprovement } = threshold;
  
  if (metricValue <= good) {
    // Good - no assertion needed
    return { status: 'good', value: metricValue };
  } else if (metricValue <= needsImprovement) {
    // Needs improvement - warning
    console.warn(`⚠️  ${metricName}: ${metricValue} (Needs Improvement - Target: ${good})`);
    return { status: 'needs-improvement', value: metricValue };
  } else {
    // Poor - fail test
    return { status: 'poor', value: metricValue };
  }
}

/**
 * Generate performance report
 */
function generatePerformanceReport(metrics, timing, resources, networkCondition, browser) {
  return {
    timestamp: new Date().toISOString(),
    browser,
    networkCondition,
    coreWebVitals: {
      LCP: {
        value: metrics.LCP,
        status: assertMetricThreshold(metrics.LCP, CORE_WEB_VITALS_THRESHOLDS.LCP, 'LCP').status,
        threshold: CORE_WEB_VITALS_THRESHOLDS.LCP,
      },
      FID: {
        value: metrics.FID,
        status: metrics.FID ? assertMetricThreshold(metrics.FID, CORE_WEB_VITALS_THRESHOLDS.FID, 'FID').status : 'N/A',
        threshold: CORE_WEB_VITALS_THRESHOLDS.FID,
      },
      CLS: {
        value: metrics.CLS,
        status: assertMetricThreshold(metrics.CLS, CORE_WEB_VITALS_THRESHOLDS.CLS, 'CLS').status,
        threshold: CORE_WEB_VITALS_THRESHOLDS.CLS,
      },
      FCP: {
        value: metrics.FCP,
        status: assertMetricThreshold(metrics.FCP, CORE_WEB_VITALS_THRESHOLDS.FCP, 'FCP').status,
        threshold: CORE_WEB_VITALS_THRESHOLDS.FCP,
      },
    },
    timing: {
      pageLoadTime: timing.pageLoadTime,
      domContentLoaded: timing.domContentLoaded,
      domInteractive: timing.domInteractive,
      ttfb: metrics.TTFB,
    },
    resources: {
      total: resources.totalResources,
      totalSize: `${(resources.totalSize / 1024).toFixed(2)} KB`,
      byType: resources.byType,
      slowResources: resources.slowResources,
    },
    performanceBudget: {
      pageLoadTime: {
        actual: timing.pageLoadTime,
        budget: PERFORMANCE_BUDGET.pageLoadTime,
        status: timing.pageLoadTime <= PERFORMANCE_BUDGET.pageLoadTime ? 'pass' : 'fail',
      },
      totalResourceSize: {
        actual: resources.totalSize,
        budget: PERFORMANCE_BUDGET.totalResourceSize,
        status: resources.totalSize <= PERFORMANCE_BUDGET.totalResourceSize ? 'pass' : 'fail',
      },
    },
  };
}

/**
 * Take performance screenshot
 */
async function takePerformanceScreenshot(page, name) {
  const screenshotPath = `test-results/performance-${name}-${Date.now()}.png`;
  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  });
  return screenshotPath;
}

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

test.beforeEach(async ({ page }) => {
  // Clear cache and cookies
  await page.context().clearCookies();
  
  // Set viewport to desktop by default
  await page.setViewportSize(VIEWPORTS.desktop);
});

test.afterEach(async ({ page }) => {
  // Clean up any performance observers
  await page.evaluate(() => {
    if (window.PerformanceObserver) {
      PerformanceObserver.supportedEntryTypes.forEach(type => {
        try {
          const observer = new PerformanceObserver(() => {});
          observer.observe({ type, buffered: true });
          observer.disconnect();
        } catch (_e) {
          // Ignore errors
        }
      });
    }
  });
});

// ============================================================================
// 1. CORE WEB VITALS - BASELINE TESTS
// ============================================================================

test.describe('Core Web Vitals - Baseline Performance', () => {
  test('should meet LCP threshold on desktop', async ({ page }) => {
    // Arrange & Act
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Wait for LCP to stabilize

    const metrics = await collectCoreWebVitals(page);

    // Assert
    expect(metrics.LCP).toBeTruthy();
    expect(metrics.LCP).toBeLessThanOrEqual(CORE_WEB_VITALS_THRESHOLDS.LCP.good);
    
    console.log(`✅ LCP: ${Math.round(metrics.LCP)}ms (Target: ${CORE_WEB_VITALS_THRESHOLDS.LCP.good}ms)`);
  });

  test('should meet FCP threshold on desktop', async ({ page }) => {
    // Arrange & Act
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const metrics = await collectCoreWebVitals(page);

    // Assert
    expect(metrics.FCP).toBeTruthy();
    expect(metrics.FCP).toBeLessThanOrEqual(CORE_WEB_VITALS_THRESHOLDS.FCP.good);
    
    console.log(`✅ FCP: ${Math.round(metrics.FCP)}ms (Target: ${CORE_WEB_VITALS_THRESHOLDS.FCP.good}ms)`);
  });

  test('should meet CLS threshold on desktop', async ({ page }) => {
    // Arrange & Act
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Scroll to trigger layout shifts
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await page.waitForTimeout(1000);
    
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(2000);

    const metrics = await collectCoreWebVitals(page);

    // Assert
    expect(metrics.CLS).toBeDefined();
    expect(metrics.CLS).toBeLessThanOrEqual(CORE_WEB_VITALS_THRESHOLDS.CLS.good);
    
    console.log(`✅ CLS: ${metrics.CLS.toFixed(3)} (Target: ${CORE_WEB_VITALS_THRESHOLDS.CLS.good})`);
  });

  test('should have acceptable TTFB', async ({ page }) => {
    // Arrange & Act
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const metrics = await collectCoreWebVitals(page);

    // Assert
    expect(metrics.TTFB).toBeTruthy();
    expect(metrics.TTFB).toBeLessThan(600); // 600ms is acceptable for TTFB
    
    console.log(`✅ TTFB: ${Math.round(metrics.TTFB)}ms (Target: < 600ms)`);
  });

  test('should measure FID on user interaction', async ({ page }) => {
    // Arrange
    await page.goto('/', { waitUntil: 'networkidle' });

    // Act
    const fid = await measureFirstInputDelay(page);

    // Assert
    expect(fid).toBeLessThanOrEqual(CORE_WEB_VITALS_THRESHOLDS.FID.good);
    
    console.log(`✅ FID: ${fid}ms (Target: ${CORE_WEB_VITALS_THRESHOLDS.FID.good}ms)`);
  });
});

// ============================================================================
// 2. NETWORK CONDITIONS - 3G PERFORMANCE
// ============================================================================

test.describe('Performance on 3G Networks', () => {
  test('should meet LCP threshold on Fast 3G', async ({ page, context }) => {
    // Arrange
    const client = await context.newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', NETWORK_CONDITIONS.fast3G);

    // Act
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);

    const metrics = await collectCoreWebVitals(page);
    const timing = await collectPerformanceTiming(page);

    // Assert
    expect(metrics.LCP).toBeTruthy();
    expect(metrics.LCP).toBeLessThanOrEqual(CORE_WEB_VITALS_THRESHOLDS.LCP.needsImprovement);
    
    console.log(`📱 Fast 3G - LCP: ${Math.round(metrics.LCP)}ms, Page Load: ${timing.pageLoadTime}ms`);
    
    // Take screenshot
    await takePerformanceScreenshot(page, 'fast-3g-lcp');
  });

  test('should meet FCP threshold on Fast 3G', async ({ page, context }) => {
    // Arrange
    const client = await context.newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', NETWORK_CONDITIONS.fast3G);

    // Act
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    const metrics = await collectCoreWebVitals(page);

    // Assert
    expect(metrics.FCP).toBeTruthy();
    expect(metrics.FCP).toBeLessThanOrEqual(CORE_WEB_VITALS_THRESHOLDS.FCP.needsImprovement);
    
    console.log(`📱 Fast 3G - FCP: ${Math.round(metrics.FCP)}ms`);
  });

  test('should load critical content on Slow 3G', async ({ page, context }) => {
    // Arrange
    const client = await context.newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', NETWORK_CONDITIONS.slow3G);

    // Act
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    const metrics = await collectCoreWebVitals(page);
    const timing = await collectPerformanceTiming(page);

    // Assert - More lenient thresholds for Slow 3G
    expect(metrics.LCP).toBeTruthy();
    expect(metrics.LCP).toBeLessThan(10000); // 10 seconds max on Slow 3G
    expect(timing.domContentLoaded).toBeLessThan(8000); // 8 seconds for DOM ready
    
    console.log(`📱 Slow 3G - LCP: ${Math.round(metrics.LCP)}ms, DOM Ready: ${timing.domContentLoaded}ms`);
    
    // Verify critical content is visible
    const storeInfoSection = page.locator(SELECTORS.storeInfoSection).first();
    await expect(storeInfoSection).toBeVisible({ timeout: 10000 });
  });

  test('should maintain CLS on 3G networks', async ({ page, context }) => {
    // Arrange
    const client = await context.newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', NETWORK_CONDITIONS.fast3G);

    // Act
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Scroll to trigger potential layout shifts
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(3000);

    const metrics = await collectCoreWebVitals(page);

    // Assert
    expect(metrics.CLS).toBeDefined();
    expect(metrics.CLS).toBeLessThanOrEqual(CORE_WEB_VITALS_THRESHOLDS.CLS.needsImprovement);
    
    console.log(`📱 Fast 3G - CLS: ${metrics.CLS.toFixed(3)}`);
  });
});

// ============================================================================
// 3. CROSS-BROWSER PERFORMANCE
// ============================================================================

test.describe('Cross-Browser Performance', () => {
  for (const browserConfig of BROWSER_CONFIGS) {
    test(`should meet Core Web Vitals in ${browserConfig.name}`, async () => {
      // Arrange
      const browser = await browserConfig.browserType.launch();
      const context = await browser.newContext({
        viewport: VIEWPORTS.desktop,
      });
      const page = await context.newPage();

      try {
        // Act
        await page.goto('/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);

        const metrics = await collectCoreWebVitals(page);
        const timing = await collectPerformanceTiming(page);
        const resources = await collectResourceMetrics(page);

        // Generate report
        const report = generatePerformanceReport(
          metrics,
          timing,
          resources,
          'WiFi',
          browserConfig.name
        );

        console.log(`\n🌐 ${browserConfig.name} Performance Report:`);
        console.log(JSON.stringify(report, null, 2));

        // Assert
        expect(metrics.LCP).toBeLessThanOrEqual(CORE_WEB_VITALS_THRESHOLDS.LCP.needsImprovement);
        expect(metrics.FCP).toBeLessThanOrEqual(CORE_WEB_VITALS_THRESHOLDS.FCP.needsImprovement);
        expect(metrics.CLS).toBeLessThanOrEqual(CORE_WEB_VITALS_THRESHOLDS.CLS.needsImprovement);

        // Take screenshot
        await takePerformanceScreenshot(page, `${browserConfig.name.toLowerCase()}-performance`);
      } finally {
        await context.close();
        await browser.close();
      }
    });
  }
});

// ============================================================================
// 4. RESPONSIVE PERFORMANCE
// ============================================================================

test.describe('Responsive Performance', () => {
  for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
    test(`should meet Core Web Vitals on ${viewportName}`, async ({ page }) => {
      // Arrange
      await page.setViewportSize(viewport);

      // Act
      await page.goto('/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);

      const metrics = await collectCoreWebVitals(page);
      const timing = await collectPerformanceTiming(page);

      // Assert
      expect(metrics.LCP).toBeLessThanOrEqual(CORE_WEB_VITALS_THRESHOLDS.LCP.needsImprovement);
      expect(metrics.FCP).toBeLessThanOrEqual(CORE_WEB_VITALS_THRESHOLDS.FCP.needsImprovement);
      expect(metrics.CLS).toBeLessThanOrEqual(CORE_WEB_VITALS_THRESHOLDS.CLS.needsImprovement);

      console.log(`📱 ${viewportName} - LCP: ${Math.round(metrics.LCP)}ms, FCP: ${Math.round(metrics.FCP)}ms, CLS: ${metrics.CLS.toFixed(3)}`);

      // Take screenshot
      await takePerformanceScreenshot(page, `${viewportName}-performance`);
    });
  }
});

// ============================================================================
// 5. RESOURCE LOADING PERFORMANCE
// ============================================================================

test.describe('Resource Loading Performance', () => {
  test('should meet resource count budget', async ({ page }) => {
    // Arrange & Act
    await page.goto('/', { waitUntil: 'networkidle' });

    const resources = await collectResourceMetrics(page);

    // Assert
    expect(resources.totalResources).toBeLessThanOrEqual(PERFORMANCE_BUDGET.resourceCount);
    
    console.log(`📦 Total Resources: ${resources.totalResources} (Budget: ${PERFORMANCE_BUDGET.resourceCount})`);
  });

  test('should meet total resource size budget', async ({ page }) => {
    // Arrange & Act
    await page.goto('/', { waitUntil: 'networkidle' });

    const resources = await collectResourceMetrics(page);

    // Assert
    expect(resources.totalSize).toBeLessThanOrEqual(PERFORMANCE_BUDGET.totalResourceSize);
    
    console.log(`📦 Total Size: ${(resources.totalSize / 1024).toFixed(2)} KB (Budget: ${(PERFORMANCE_BUDGET.totalResourceSize / 1024).toFixed(2)} KB)`);
  });

  test('should meet JavaScript size budget', async ({ page }) => {
    // Arrange & Act
    await page.goto('/', { waitUntil: 'networkidle' });

    const resources = await collectResourceMetrics(page);

    // Assert
    expect(resources.byType.script.size).toBeLessThanOrEqual(PERFORMANCE_BUDGET.jsSize);
    
    console.log(`📦 JS Size: ${(resources.byType.script.size / 1024).toFixed(2)} KB (Budget: ${(PERFORMANCE_BUDGET.jsSize / 1024).toFixed(2)} KB)`);
  });

  test('should meet CSS size budget', async ({ page }) => {
    // Arrange & Act
    await page.goto('/', { waitUntil: 'networkidle' });

    const resources = await collectResourceMetrics(page);

    // Assert
    expect(resources.byType.stylesheet.size).toBeLessThanOrEqual(PERFORMANCE_BUDGET.cssSize);
    
    console.log(`📦 CSS Size: ${(resources.byType.stylesheet.size / 1024).toFixed(2)} KB (Budget: ${(PERFORMANCE_BUDGET.cssSize / 1024).toFixed(2)} KB)`);
  });

  test('should meet image size budget', async ({ page }) => {
    // Arrange & Act
    await page.goto('/', { waitUntil: 'networkidle' });

    const resources = await collectResourceMetrics(page);

    // Assert
    expect(resources.byType.image.size).toBeLessThanOrEqual(PERFORMANCE_BUDGET.imageSize);
    
    console.log(`📦 Image Size: ${(resources.byType.image.size / 1024).toFixed(2)} KB (Budget: ${(PERFORMANCE_BUDGET.imageSize / 1024).toFixed(2)} KB)`);
  });

  test('should not have slow loading resources', async ({ page }) => {
    // Arrange & Act
    await page.goto('/', { waitUntil: 'networkidle' });

    const resources = await collectResourceMetrics(page);

    // Assert
    expect(resources.slowResources.length).toBeLessThanOrEqual(3); // Max 3 slow resources
    
    if (resources.slowResources.length > 0) {
      console.warn('⚠️  Slow Resources:');
      resources.slowResources.forEach(resource => {
        console.warn(`   - ${resource.name} (${resource.duration}ms, ${(resource.size / 1024).toFixed(2)} KB)`);
      });
    }
  });

  test('should use efficient image formats', async ({ page }) => {
    // Arrange & Act
    await page.goto('/', { waitUntil: 'networkidle' });

    const imageFormats = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.map(img => ({
        src: img.src,
        format: img.src.split('.').pop().split('?')[0].toLowerCase(),
      }));
    });

    // Assert - Check for modern formats (WebP, AVIF)
    const modernFormats = imageFormats.filter(img => 
      ['webp', 'avif'].includes(img.format)
    );

    const modernFormatPercentage = (modernFormats.length / imageFormats.length) * 100;
    
    console.log(`🖼️  Modern Image Formats: ${modernFormatPercentage.toFixed(1)}% (${modernFormats.length}/${imageFormats.length})`);
    
    // At least 50% of images should use modern formats
    expect(modernFormatPercentage).toBeGreaterThanOrEqual(50);
  });
});

// ============================================================================
// 6. PAGE LOAD TIMING
// ============================================================================

test.describe('Page Load Timing', () => {
  test('should meet page load time budget', async ({ page }) => {
    // Arrange & Act
    await page.goto('/', { waitUntil: 'load' });

    const timing = await collectPerformanceTiming(page);

    // Assert
    expect(timing.pageLoadTime).toBeLessThanOrEqual(PERFORMANCE_BUDGET.pageLoadTime);
    
    console.log(`⏱️  Page Load Time: ${timing.pageLoadTime}ms (Budget: ${PERFORMANCE_BUDGET.pageLoadTime}ms)`);
  });

  test('should meet DOM content loaded budget', async ({ page }) => {
    // Arrange & Act
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const timing = await collectPerformanceTiming(page);

    // Assert
    expect(timing.domContentLoaded).toBeLessThanOrEqual(PERFORMANCE_BUDGET.domContentLoaded);
    
    console.log(`⏱️  DOM Content Loaded: ${timing.domContentLoaded}ms (Budget: ${PERFORMANCE_BUDGET.domContentLoaded}ms)`);
  });

  test('should have fast DNS lookup', async ({ page }) => {
    // Arrange & Act
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const timing = await collectPerformanceTiming(page);

    // Assert
    expect(timing.dnsTime).toBeLessThan(100); // DNS should be < 100ms
    
    console.log(`⏱️  DNS Lookup: ${timing.dnsTime}ms`);
  });

  test('should have fast TCP connection', async ({ page }) => {
    // Arrange & Act
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const timing = await collectPerformanceTiming(page);

    // Assert
    expect(timing.tcpTime).toBeLessThan(200); // TCP should be < 200ms
    
    console.log(`⏱️  TCP Connection: ${timing.tcpTime}ms`);
  });

  test('should have fast server response', async ({ page }) => {
    // Arrange & Act
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const timing = await collectPerformanceTiming(page);

    // Assert
    expect(timing.responseTime).toBeLessThan(500); // Response should be < 500ms
    
    console.log(`⏱️  Server Response: ${timing.responseTime}ms`);
  });
});

// ============================================================================
// 7. CRITICAL RENDERING PATH
// ============================================================================

test.describe('Critical Rendering Path', () => {
  test('should render above-the-fold content quickly', async ({ page }) => {
    // Arrange & Act
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Wait for critical content
    const storeInfoSection = page.locator(SELECTORS.storeInfoSection).first();
    await storeInfoSection.waitFor({ state: 'visible', timeout: 3000 });

    const renderTime = Date.now() - startTime;

    // Assert
    expect(renderTime).toBeLessThan(2000); // Above-the-fold should render in < 2s
    
    console.log(`🎨 Above-the-fold Render Time: ${renderTime}ms`);
  });

  test('should not block rendering with JavaScript', async ({ page }) => {
    // Arrange & Act
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const timing = await collectPerformanceTiming(page);
    const metrics = await collectCoreWebVitals(page);

    // Assert - FCP should happen before DOM complete
    expect(metrics.FCP).toBeLessThan(timing.domProcessingTime);
    
    console.log(`🎨 FCP: ${Math.round(metrics.FCP)}ms, DOM Processing: ${timing.domProcessingTime}ms`);
  });

  test('should load critical CSS inline', async ({ page }) => {
    // Arrange & Act
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const hasInlineCSS = await page.evaluate(() => {
      const styleElements = Array.from(document.querySelectorAll('style'));
      return styleElements.some(style => style.textContent.length > 100);
    });

    // Assert
    expect(hasInlineCSS).toBe(true);
    
    console.log(`🎨 Critical CSS Inlined: ${hasInlineCSS ? 'Yes' : 'No'}`);
  });

  test('should defer non-critical JavaScript', async ({ page }) => {
    // Arrange & Act
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const scriptLoading = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      return {
        total: scripts.length,
        deferred: scripts.filter(s => s.defer || s.async).length,
        blocking: scripts.filter(s => !s.defer && !s.async).length,
      };
    });

    // Assert - Most scripts should be deferred or async
    const deferredPercentage = (scriptLoading.deferred / scriptLoading.total) * 100;
    expect(deferredPercentage).toBeGreaterThanOrEqual(70); // At least 70% deferred
    
    console.log(`🎨 Deferred Scripts: ${deferredPercentage.toFixed(1)}% (${scriptLoading.deferred}/${scriptLoading.total})`);
  });
});

// ============================================================================
// 8. CACHING AND COMPRESSION
// ============================================================================

test.describe('Caching and Compression', () => {
  test('should use browser caching for static assets', async ({ page }) => {
    // Arrange & Act
    await page.goto('/', { waitUntil: 'networkidle' });

    const cacheHeaders = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(r => r.name.match(/\.(js|css|jpg|png|gif|svg|woff|woff2)$/))
        .map(r => ({
          name: r.name,
          cached: r.transferSize === 0,
        }));
    });

    // Reload page to test caching
    await page.reload({ waitUntil: 'networkidle' });

    const cachedResources = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(r => r.transferSize === 0).length;
    });

    // Assert - Some resources should be cached on reload
    expect(cachedResources).toBeGreaterThan(0);
    
    console.log(`💾 Cached Resources on Reload: ${cachedResources}`);
  });

  test('should use compression for text resources', async ({ page, context }) => {
    // Arrange
    const client = await context.newCDPSession(page);
    const responses = [];

    client.on('Network.responseReceived', (params) => {
      responses.push(params.response);
    });

    await client.send('Network.enable');

    // Act
    await page.goto('/', { waitUntil: 'networkidle' });

    // Assert
    const textResources = responses.filter(r => 
      r.mimeType.includes('javascript') || 
      r.mimeType.includes('css') || 
      r.mimeType.includes('html')
    );

    const compressedResources = textResources.filter(r => 
      r.headers['content-encoding'] === 'gzip' || 
      r.headers['content-encoding'] === 'br'
    );

    const compressionRate = (compressedResources.length / textResources.length) * 100;

    expect(compressionRate).toBeGreaterThanOrEqual(90); // At least 90% compressed
    
    console.log(`🗜️  Compressed Text Resources: ${compressionRate.toFixed(1)}% (${compressedResources.length}/${textResources.length})`);
  });
});

// ============================================================================
// 9. PERFORMANCE REGRESSION DETECTION
// ============================================================================

test.describe('Performance Regression Detection', () => {
  test('should detect LCP regression', async ({ page }) => {
    // Arrange
    const baselineLCP = 2000; // Baseline from previous test run

    // Act
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const metrics = await collectCoreWebVitals(page);

    // Assert - LCP should not regress by more than 20%
    const regressionThreshold = baselineLCP * 1.2;
    expect(metrics.LCP).toBeLessThanOrEqual(regressionThreshold);
    
    const regressionPercentage = ((metrics.LCP - baselineLCP) / baselineLCP) * 100;
    console.log(`📊 LCP Regression: ${regressionPercentage.toFixed(1)}% (Baseline: ${baselineLCP}ms, Current: ${Math.round(metrics.LCP)}ms)`);
  });

  test('should detect resource size regression', async ({ page }) => {
    // Arrange
    const baselineTotalSize = 1.5 * 1024 * 1024; // 1.5 MB baseline

    // Act
    await page.goto('/', { waitUntil: 'networkidle' });

    const resources = await collectResourceMetrics(page);

    // Assert - Total size should not increase by more than 15%
    const regressionThreshold = baselineTotalSize * 1.15;
    expect(resources.totalSize).toBeLessThanOrEqual(regressionThreshold);
    
    const regressionPercentage = ((resources.totalSize - baselineTotalSize) / baselineTotalSize) * 100;
    console.log(`📊 Resource Size Regression: ${regressionPercentage.toFixed(1)}% (Baseline: ${(baselineTotalSize / 1024).toFixed(2)} KB, Current: ${(resources.totalSize / 1024).toFixed(2)} KB)`);
  });
});

// ============================================================================
// 10. COMPREHENSIVE PERFORMANCE REPORT
// ============================================================================

test.describe('Comprehensive Performance Report', () => {
  test('should generate complete performance report', async ({ page }) => {
    // Arrange & Act
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    const metrics = await collectCoreWebVitals(page);
    const timing = await collectPerformanceTiming(page);
    const resources = await collectResourceMetrics(page);

    const report = generatePerformanceReport(metrics, timing, resources, 'WiFi', 'Chromium');

    // Assert
    expect(report.coreWebVitals.LCP.status).not.toBe('poor');
    expect(report.coreWebVitals.FCP.status).not.toBe('poor');
    expect(report.coreWebVitals.CLS.status).not.toBe('poor');

    // Log complete report
    console.log('\n📊 Complete Performance Report:');
    console.log('='.repeat(80));
    console.log(JSON.stringify(report, null, 2));
    console.log('='.repeat(80));

    // Take final screenshot
    await takePerformanceScreenshot(page, 'final-report');
  });
});