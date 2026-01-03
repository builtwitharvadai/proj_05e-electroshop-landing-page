/**
 * Performance Monitoring Module
 * 
 * Implements Core Web Vitals tracking (LCP, FID, CLS), performance observer
 * for monitoring, resource preloading logic, and performance metrics reporting.
 * Provides comprehensive error handling and structured logging for production use.
 * 
 * @module scripts/performance
 * @generated-from task-id:TASK-006 sprint:performance-optimization
 * @modifies none
 * @dependencies none
 */

/**
 * Core Web Vitals thresholds (milliseconds)
 * Based on Google's recommended thresholds
 * @type {Object}
 */
const WEB_VITALS_THRESHOLDS = Object.freeze({
  LCP: {
    GOOD: 2500,
    NEEDS_IMPROVEMENT: 4000,
  },
  FID: {
    GOOD: 100,
    NEEDS_IMPROVEMENT: 300,
  },
  CLS: {
    GOOD: 0.1,
    NEEDS_IMPROVEMENT: 0.25,
  },
  TTFB: {
    GOOD: 800,
    NEEDS_IMPROVEMENT: 1800,
  },
  FCP: {
    GOOD: 1800,
    NEEDS_IMPROVEMENT: 3000,
  },
});

/**
 * Performance metric types
 * @type {Object}
 */
const METRIC_TYPES = Object.freeze({
  LCP: 'largest-contentful-paint',
  FID: 'first-input-delay',
  CLS: 'cumulative-layout-shift',
  TTFB: 'time-to-first-byte',
  FCP: 'first-contentful-paint',
  INP: 'interaction-to-next-paint',
});

/**
 * Event types for tracking
 * @type {Object}
 */
const EVENTS = Object.freeze({
  METRIC_CAPTURED: 'performance:metric:captured',
  THRESHOLD_EXCEEDED: 'performance:threshold:exceeded',
  INIT: 'performance:init',
  ERROR: 'performance:error',
  REPORT: 'performance:report',
  PRELOAD: 'performance:preload',
});

/**
 * Global state for performance monitoring
 * @type {Object}
 */
const state = {
  metrics: new Map(),
  observers: new Map(),
  initialized: false,
  reportingEnabled: true,
  layoutShiftScore: 0,
  layoutShiftEntries: [],
  firstInputDelay: null,
  largestContentfulPaint: null,
  navigationTiming: null,
};

/**
 * Log structured event with context
 * @param {string} eventType - Event type identifier
 * @param {Object} context - Event context data
 */
function logEvent(eventType, context = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event: eventType,
    context,
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  if (process.env.NODE_ENV !== 'production') {
    console.log('[Performance]', logEntry);
  }

  window.dispatchEvent(
    new CustomEvent('performance:analytics', {
      detail: logEntry,
    })
  );
}

/**
 * Determine metric rating based on thresholds
 * @param {string} metricName - Metric name
 * @param {number} value - Metric value
 * @returns {string} Rating: 'good', 'needs-improvement', or 'poor'
 */
function getMetricRating(metricName, value) {
  const thresholds = WEB_VITALS_THRESHOLDS[metricName];
  
  if (!thresholds) {
    return 'unknown';
  }

  if (value <= thresholds.GOOD) {
    return 'good';
  }
  
  if (value <= thresholds.NEEDS_IMPROVEMENT) {
    return 'needs-improvement';
  }
  
  return 'poor';
}

/**
 * Store and report metric
 * @param {string} metricName - Metric name
 * @param {number} value - Metric value
 * @param {Object} metadata - Additional metadata
 */
function recordMetric(metricName, value, metadata = {}) {
  const rating = getMetricRating(metricName, value);
  
  const metric = {
    name: metricName,
    value,
    rating,
    timestamp: Date.now(),
    metadata,
  };

  state.metrics.set(metricName, metric);

  logEvent(EVENTS.METRIC_CAPTURED, metric);

  if (rating === 'poor') {
    logEvent(EVENTS.THRESHOLD_EXCEEDED, {
      metric: metricName,
      value,
      threshold: WEB_VITALS_THRESHOLDS[metricName]?.NEEDS_IMPROVEMENT,
      rating,
    });
  }

  if (state.reportingEnabled) {
    reportMetricToAnalytics(metric);
  }
}

/**
 * Report metric to analytics endpoint
 * @param {Object} metric - Metric object
 */
function reportMetricToAnalytics(metric) {
  try {
    if (navigator.sendBeacon) {
      const data = JSON.stringify({
        ...metric,
        url: window.location.href,
        userAgent: navigator.userAgent,
        connection: navigator.connection
          ? {
              effectiveType: navigator.connection.effectiveType,
              downlink: navigator.connection.downlink,
              rtt: navigator.connection.rtt,
            }
          : null,
      });

      const blob = new Blob([data], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/performance', blob);
    }
  } catch (error) {
    console.error('[Performance] Failed to report metric:', error);
    logEvent(EVENTS.ERROR, {
      operation: 'reportMetricToAnalytics',
      error: error.message,
      metric: metric.name,
    });
  }
}

/**
 * Observe Largest Contentful Paint (LCP)
 */
function observeLCP() {
  try {
    if (!('PerformanceObserver' in window)) {
      console.warn('[Performance] PerformanceObserver not supported');
      return;
    }

    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];

      if (lastEntry) {
        state.largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime;
        
        recordMetric('LCP', state.largestContentfulPaint, {
          element: lastEntry.element?.tagName,
          url: lastEntry.url,
          size: lastEntry.size,
        });
      }
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });
    state.observers.set('lcp', observer);
  } catch (error) {
    console.error('[Performance] Failed to observe LCP:', error);
    logEvent(EVENTS.ERROR, {
      operation: 'observeLCP',
      error: error.message,
    });
  }
}

/**
 * Observe First Input Delay (FID)
 */
function observeFID() {
  try {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      
      entries.forEach((entry) => {
        if (state.firstInputDelay === null) {
          state.firstInputDelay = entry.processingStart - entry.startTime;
          
          recordMetric('FID', state.firstInputDelay, {
            eventType: entry.name,
            target: entry.target?.tagName,
            duration: entry.duration,
          });
        }
      });
    });

    observer.observe({ type: 'first-input', buffered: true });
    state.observers.set('fid', observer);
  } catch (error) {
    console.error('[Performance] Failed to observe FID:', error);
    logEvent(EVENTS.ERROR, {
      operation: 'observeFID',
      error: error.message,
    });
  }
}

/**
 * Observe Cumulative Layout Shift (CLS)
 */
function observeCLS() {
  try {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          state.layoutShiftScore += entry.value;
          state.layoutShiftEntries.push({
            value: entry.value,
            timestamp: entry.startTime,
            sources: entry.sources?.map((source) => ({
              node: source.node?.tagName,
              previousRect: source.previousRect,
              currentRect: source.currentRect,
            })),
          });
        }
      });

      recordMetric('CLS', state.layoutShiftScore, {
        entryCount: state.layoutShiftEntries.length,
        lastShift: state.layoutShiftEntries[state.layoutShiftEntries.length - 1],
      });
    });

    observer.observe({ type: 'layout-shift', buffered: true });
    state.observers.set('cls', observer);
  } catch (error) {
    console.error('[Performance] Failed to observe CLS:', error);
    logEvent(EVENTS.ERROR, {
      operation: 'observeCLS',
      error: error.message,
    });
  }
}

/**
 * Capture navigation timing metrics
 */
function captureNavigationTiming() {
  try {
    if (!window.performance || !window.performance.timing) {
      console.warn('[Performance] Navigation Timing API not supported');
      return;
    }

    const timing = window.performance.timing;
    const navigation = window.performance.navigation;

    state.navigationTiming = {
      navigationStart: timing.navigationStart,
      redirectTime: timing.redirectEnd - timing.redirectStart,
      dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
      tcpTime: timing.connectEnd - timing.connectStart,
      requestTime: timing.responseStart - timing.requestStart,
      responseTime: timing.responseEnd - timing.responseStart,
      domProcessingTime: timing.domComplete - timing.domLoading,
      domContentLoadedTime: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
      loadEventTime: timing.loadEventEnd - timing.loadEventStart,
      totalTime: timing.loadEventEnd - timing.navigationStart,
      navigationType: navigation.type,
      redirectCount: navigation.redirectCount,
    };

    const ttfb = timing.responseStart - timing.navigationStart;
    recordMetric('TTFB', ttfb, {
      navigationTiming: state.navigationTiming,
    });

    logEvent('performance:navigation:captured', state.navigationTiming);
  } catch (error) {
    console.error('[Performance] Failed to capture navigation timing:', error);
    logEvent(EVENTS.ERROR, {
      operation: 'captureNavigationTiming',
      error: error.message,
    });
  }
}

/**
 * Observe First Contentful Paint (FCP)
 */
function observeFCP() {
  try {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          recordMetric('FCP', entry.startTime, {
            entryType: entry.entryType,
          });
        }
      });
    });

    observer.observe({ type: 'paint', buffered: true });
    state.observers.set('fcp', observer);
  } catch (error) {
    console.error('[Performance] Failed to observe FCP:', error);
    logEvent(EVENTS.ERROR, {
      operation: 'observeFCP',
      error: error.message,
    });
  }
}

/**
 * Preload critical resources
 * @param {Array<Object>} resources - Array of resource objects with url and type
 */
export function preloadResources(resources = []) {
  if (!Array.isArray(resources) || resources.length === 0) {
    return;
  }

  const startTime = performance.now();

  try {
    resources.forEach((resource) => {
      if (!resource.url || !resource.type) {
        console.warn('[Performance] Invalid resource for preloading:', resource);
        return;
      }

      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.url;
      link.as = resource.type;

      if (resource.type === 'font') {
        link.crossOrigin = 'anonymous';
      }

      if (resource.media) {
        link.media = resource.media;
      }

      link.addEventListener('load', () => {
        logEvent(EVENTS.PRELOAD, {
          url: resource.url,
          type: resource.type,
          status: 'loaded',
        });
      });

      link.addEventListener('error', (error) => {
        logEvent(EVENTS.ERROR, {
          operation: 'preloadResource',
          url: resource.url,
          type: resource.type,
          error: error.message || 'Failed to preload resource',
        });
      });

      document.head.appendChild(link);
    });

    const preloadTime = performance.now() - startTime;
    logEvent(EVENTS.PRELOAD, {
      resourceCount: resources.length,
      duration: preloadTime,
    });
  } catch (error) {
    console.error('[Performance] Failed to preload resources:', error);
    logEvent(EVENTS.ERROR, {
      operation: 'preloadResources',
      error: error.message,
      resourceCount: resources.length,
    });
  }
}

/**
 * Prefetch resources for future navigation
 * @param {Array<string>} urls - Array of URLs to prefetch
 */
export function prefetchResources(urls = []) {
  if (!Array.isArray(urls) || urls.length === 0) {
    return;
  }

  try {
    urls.forEach((url) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });

    logEvent('performance:prefetch', {
      urlCount: urls.length,
    });
  } catch (error) {
    console.error('[Performance] Failed to prefetch resources:', error);
    logEvent(EVENTS.ERROR, {
      operation: 'prefetchResources',
      error: error.message,
    });
  }
}

/**
 * Get all captured metrics
 * @returns {Object} All metrics
 */
export function getMetrics() {
  return {
    metrics: Object.fromEntries(state.metrics),
    navigationTiming: state.navigationTiming,
    layoutShiftScore: state.layoutShiftScore,
    layoutShiftEntries: state.layoutShiftEntries,
  };
}

/**
 * Generate performance report
 * @returns {Object} Performance report
 */
export function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    connection: navigator.connection
      ? {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt,
          saveData: navigator.connection.saveData,
        }
      : null,
    metrics: Object.fromEntries(state.metrics),
    navigationTiming: state.navigationTiming,
    summary: {
      overallRating: calculateOverallRating(),
      criticalIssues: getCriticalIssues(),
      recommendations: getRecommendations(),
    },
  };

  logEvent(EVENTS.REPORT, report);

  return report;
}

/**
 * Calculate overall performance rating
 * @returns {string} Overall rating
 */
function calculateOverallRating() {
  const ratings = Array.from(state.metrics.values()).map((m) => m.rating);
  
  if (ratings.includes('poor')) {
    return 'poor';
  }
  
  if (ratings.includes('needs-improvement')) {
    return 'needs-improvement';
  }
  
  return 'good';
}

/**
 * Get critical performance issues
 * @returns {Array<Object>} Critical issues
 */
function getCriticalIssues() {
  const issues = [];

  state.metrics.forEach((metric) => {
    if (metric.rating === 'poor') {
      issues.push({
        metric: metric.name,
        value: metric.value,
        threshold: WEB_VITALS_THRESHOLDS[metric.name]?.NEEDS_IMPROVEMENT,
        severity: 'high',
      });
    }
  });

  return issues;
}

/**
 * Get performance recommendations
 * @returns {Array<string>} Recommendations
 */
function getRecommendations() {
  const recommendations = [];

  state.metrics.forEach((metric) => {
    if (metric.rating === 'poor' || metric.rating === 'needs-improvement') {
      switch (metric.name) {
        case 'LCP':
          recommendations.push('Optimize largest contentful paint by reducing server response time, optimizing images, and removing render-blocking resources');
          break;
        case 'FID':
          recommendations.push('Improve first input delay by breaking up long tasks, optimizing JavaScript execution, and using web workers');
          break;
        case 'CLS':
          recommendations.push('Reduce cumulative layout shift by setting size attributes on images and videos, avoiding inserting content above existing content');
          break;
        case 'TTFB':
          recommendations.push('Improve time to first byte by optimizing server response time, using CDN, and implementing caching');
          break;
        case 'FCP':
          recommendations.push('Optimize first contentful paint by eliminating render-blocking resources and optimizing critical rendering path');
          break;
      }
    }
  });

  return [...new Set(recommendations)];
}

/**
 * Initialize performance monitoring
 * @param {Object} options - Configuration options
 * @returns {Promise<void>}
 */
export async function initPerformanceMonitoring(options = {}) {
  if (state.initialized) {
    console.warn('[Performance] Performance monitoring already initialized');
    return;
  }

  const startTime = performance.now();

  try {
    state.reportingEnabled = options.reportingEnabled !== false;

    logEvent(EVENTS.INIT, {
      reportingEnabled: state.reportingEnabled,
      supportsPerformanceObserver: 'PerformanceObserver' in window,
      supportsNavigationTiming: !!(window.performance && window.performance.timing),
    });

    observeLCP();
    observeFID();
    observeCLS();
    observeFCP();

    if (document.readyState === 'complete') {
      captureNavigationTiming();
    } else {
      window.addEventListener('load', captureNavigationTiming);
    }

    window.addEventListener('beforeunload', () => {
      const finalReport = generateReport();
      
      if (state.reportingEnabled && navigator.sendBeacon) {
        const data = JSON.stringify(finalReport);
        const blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon('/api/analytics/performance/report', blob);
      }
    });

    state.initialized = true;

    const initTime = performance.now() - startTime;
    logEvent('performance:init:complete', {
      duration: initTime,
    });
  } catch (error) {
    console.error('[Performance] Initialization failed:', error);
    logEvent(EVENTS.ERROR, {
      operation: 'initPerformanceMonitoring',
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Cleanup performance monitoring resources
 */
export function cleanup() {
  state.observers.forEach((observer) => {
    observer.disconnect();
  });

  state.observers.clear();
  state.metrics.clear();
  state.layoutShiftEntries = [];
  state.layoutShiftScore = 0;
  state.firstInputDelay = null;
  state.largestContentfulPaint = null;
  state.navigationTiming = null;
  state.initialized = false;

  logEvent('performance:cleanup', {
    timestamp: Date.now(),
  });
}

/**
 * Get performance monitoring state
 * @returns {Object} Current state
 */
export function getPerformanceState() {
  return {
    initialized: state.initialized,
    reportingEnabled: state.reportingEnabled,
    observerCount: state.observers.size,
    metricCount: state.metrics.size,
    supportsPerformanceObserver: 'PerformanceObserver' in window,
  };
}

/**
 * Default export
 */
export default {
  initPerformanceMonitoring,
  preloadResources,
  prefetchResources,
  getMetrics,
  generateReport,
  cleanup,
  getPerformanceState,
};