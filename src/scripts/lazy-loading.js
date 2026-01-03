/**
 * Lazy Loading Module
 * 
 * Implements image lazy loading using Intersection Observer API for performance
 * optimization. Handles image loading with fade-in animation, includes fallback
 * for browsers without support, and tracks loading performance metrics.
 * 
 * @module scripts/lazy-loading
 * @generated-from task-id:TASK-006 sprint:performance-optimization
 * @modifies none
 * @dependencies none
 */

/**
 * Configuration for Intersection Observer
 * @type {Object}
 */
const OBSERVER_CONFIG = Object.freeze({
  root: null,
  rootMargin: '50px',
  threshold: 0.01,
});

/**
 * Performance timing thresholds (milliseconds)
 * @type {Object}
 */
const PERFORMANCE_THRESHOLDS = Object.freeze({
  IMAGE_LOAD_WARNING: 2000,
  IMAGE_LOAD_ERROR: 5000,
  FADE_IN_DURATION: 300,
});

/**
 * CSS classes for lazy loading states
 * @type {Object}
 */
const CSS_CLASSES = Object.freeze({
  LAZY: 'lazy-load',
  LOADING: 'lazy-load--loading',
  LOADED: 'lazy-load--loaded',
  ERROR: 'lazy-load--error',
});

/**
 * Event types for tracking
 * @type {Object}
 */
const EVENTS = Object.freeze({
  LOAD_START: 'lazyload:load:start',
  LOAD_SUCCESS: 'lazyload:load:success',
  LOAD_ERROR: 'lazyload:load:error',
  INIT: 'lazyload:init',
  FALLBACK: 'lazyload:fallback',
});

/**
 * Global state for lazy loading system
 * @type {Object}
 */
const state = {
  observer: null,
  loadedImages: new WeakSet(),
  performanceMarks: new Map(),
  initialized: false,
  supportsIntersectionObserver: false,
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
    userAgent: navigator.userAgent,
  };

  if (process.env.NODE_ENV !== 'production') {
    console.log('[LazyLoad]', logEntry);
  }

  window.dispatchEvent(
    new CustomEvent('lazyload:analytics', {
      detail: logEntry,
    })
  );
}

/**
 * Track performance metric
 * @param {string} metricName - Metric identifier
 * @param {number} value - Metric value in milliseconds
 * @param {Object} metadata - Additional metadata
 */
function trackPerformance(metricName, value, metadata = {}) {
  if (window.performance && window.performance.mark) {
    performance.mark(`lazyload:${metricName}`);
  }

  logEvent('lazyload:performance', {
    metric: metricName,
    value,
    unit: 'ms',
    ...metadata,
  });

  if (
    metricName === 'image_load' &&
    value > PERFORMANCE_THRESHOLDS.IMAGE_LOAD_WARNING
  ) {
    console.warn(
      `[LazyLoad] Image load time (${value}ms) exceeds warning threshold (${PERFORMANCE_THRESHOLDS.IMAGE_LOAD_WARNING}ms)`,
      metadata
    );
  }
}

/**
 * Add fade-in animation to loaded image
 * @param {HTMLElement} element - Image or picture element
 */
function applyFadeInAnimation(element) {
  element.classList.remove(CSS_CLASSES.LOADING);
  element.classList.add(CSS_CLASSES.LOADED);

  element.style.transition = `opacity ${PERFORMANCE_THRESHOLDS.FADE_IN_DURATION}ms ease-in-out`;
  element.style.opacity = '0';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      element.style.opacity = '1';
    });
  });

  setTimeout(() => {
    element.style.transition = '';
  }, PERFORMANCE_THRESHOLDS.FADE_IN_DURATION);
}

/**
 * Load image with performance tracking and error handling
 * @param {HTMLImageElement} img - Image element to load
 * @returns {Promise<void>}
 */
function loadImage(img) {
  return new Promise((resolve, reject) => {
    if (state.loadedImages.has(img)) {
      resolve();
      return;
    }

    const startTime = performance.now();
    const src = img.dataset.src || img.dataset.lazySrc;
    const imageId = img.dataset.imageId || img.alt || src;

    if (!src) {
      const error = new Error('No source URL found for lazy loading');
      logEvent(EVENTS.LOAD_ERROR, {
        imageId,
        error: error.message,
      });
      reject(error);
      return;
    }

    logEvent(EVENTS.LOAD_START, {
      imageId,
      src,
    });

    const container = img.closest('picture') || img.parentElement;
    if (container) {
      container.classList.add(CSS_CLASSES.LOADING);
    }

    const onLoad = () => {
      const loadTime = performance.now() - startTime;

      trackPerformance('image_load', loadTime, {
        imageId,
        src: img.src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      });

      logEvent(EVENTS.LOAD_SUCCESS, {
        imageId,
        src: img.src,
        loadTime,
        dimensions: `${img.naturalWidth}x${img.naturalHeight}`,
      });

      state.loadedImages.add(img);

      if (container) {
        applyFadeInAnimation(container);
      }

      cleanup();
      resolve();
    };

    const onError = (error) => {
      const loadTime = performance.now() - startTime;

      logEvent(EVENTS.LOAD_ERROR, {
        imageId,
        src,
        error: error.message || 'Image load failed',
        loadTime,
      });

      if (container) {
        container.classList.remove(CSS_CLASSES.LOADING);
        container.classList.add(CSS_CLASSES.ERROR);
      }

      img.alt = `${img.alt || 'Image'} (failed to load)`;

      cleanup();
      reject(new Error(`Failed to load image: ${src}`));
    };

    const cleanup = () => {
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
      clearTimeout(timeoutId);
    };

    img.addEventListener('load', onLoad);
    img.addEventListener('error', onError);

    const picture = img.parentElement;
    if (picture && picture.tagName === 'PICTURE') {
      const sources = picture.querySelectorAll('source[data-srcset]');
      sources.forEach((source) => {
        if (source.dataset.srcset) {
          source.srcset = source.dataset.srcset;
          delete source.dataset.srcset;
        }
      });
    }

    img.src = src;
    delete img.dataset.src;
    delete img.dataset.lazySrc;

    const timeoutId = setTimeout(() => {
      if (!state.loadedImages.has(img)) {
        onError(new Error('Image load timeout'));
      }
    }, PERFORMANCE_THRESHOLDS.IMAGE_LOAD_ERROR);
  });
}

/**
 * Handle intersection observer callback
 * @param {IntersectionObserverEntry[]} entries - Observer entries
 */
function handleIntersection(entries) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const target = entry.target;
      const img = target.tagName === 'IMG' ? target : target.querySelector('img');

      if (!img) {
        console.warn('[LazyLoad] No image found in observed element', target);
        return;
      }

      if (state.loadedImages.has(img)) {
        return;
      }

      loadImage(img).catch((error) => {
        console.error('[LazyLoad] Image load error:', error);
      });

      if (state.observer) {
        state.observer.unobserve(target);
      }
    }
  });
}

/**
 * Initialize Intersection Observer
 * @returns {IntersectionObserver|null} Observer instance or null if not supported
 */
function initializeObserver() {
  if (!('IntersectionObserver' in window)) {
    console.warn(
      '[LazyLoad] IntersectionObserver not supported, using fallback'
    );
    logEvent(EVENTS.FALLBACK, {
      reason: 'IntersectionObserver not supported',
      userAgent: navigator.userAgent,
    });
    return null;
  }

  try {
    return new IntersectionObserver(handleIntersection, OBSERVER_CONFIG);
  } catch (error) {
    console.error('[LazyLoad] Failed to create IntersectionObserver:', error);
    logEvent(EVENTS.FALLBACK, {
      reason: 'IntersectionObserver creation failed',
      error: error.message,
    });
    return null;
  }
}

/**
 * Load all images immediately (fallback for browsers without IntersectionObserver)
 * @param {HTMLElement} container - Container element
 * @returns {Promise<void>}
 */
async function loadAllImagesImmediately(container) {
  const images = container.querySelectorAll(
    'img[data-src], img[data-lazy-src]'
  );

  if (images.length === 0) {
    return;
  }

  logEvent(EVENTS.FALLBACK, {
    reason: 'Loading all images immediately',
    imageCount: images.length,
  });

  const loadPromises = Array.from(images).map((img) =>
    loadImage(img).catch((error) => {
      console.error('[LazyLoad] Fallback image load error:', error);
      return null;
    })
  );

  await Promise.allSettled(loadPromises);
}

/**
 * Initialize lazy loading for a container
 * @param {string|HTMLElement} containerSelector - Container selector or element
 * @returns {Promise<void>}
 */
export async function initLazyLoading(containerSelector = 'body') {
  if (state.initialized) {
    console.warn('[LazyLoad] Lazy loading already initialized');
    return;
  }

  const startTime = performance.now();

  try {
    const container =
      typeof containerSelector === 'string'
        ? document.querySelector(containerSelector)
        : containerSelector;

    if (!container) {
      throw new Error(
        `[LazyLoad] Container not found: ${containerSelector}`
      );
    }

    state.supportsIntersectionObserver = 'IntersectionObserver' in window;

    logEvent(EVENTS.INIT, {
      containerSelector:
        typeof containerSelector === 'string'
          ? containerSelector
          : container.id || container.className,
      supportsIntersectionObserver: state.supportsIntersectionObserver,
    });

    state.observer = initializeObserver();

    if (state.observer) {
      const lazyElements = container.querySelectorAll(
        'img[data-src], img[data-lazy-src], picture:has(img[data-src]), picture:has(img[data-lazy-src])'
      );

      lazyElements.forEach((element) => {
        element.classList.add(CSS_CLASSES.LAZY);
        state.observer.observe(element);
      });

      logEvent('lazyload:observer:attached', {
        elementCount: lazyElements.length,
      });
    } else {
      await loadAllImagesImmediately(container);
    }

    state.initialized = true;

    const initTime = performance.now() - startTime;
    trackPerformance('init', initTime, {
      supportsIntersectionObserver: state.supportsIntersectionObserver,
    });
  } catch (error) {
    console.error('[LazyLoad] Initialization failed:', error);
    logEvent('lazyload:error', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Add lazy loading to dynamically added images
 * @param {HTMLElement} element - Element containing new images
 * @returns {Promise<void>}
 */
export async function observeNewImages(element) {
  if (!element) {
    console.warn('[LazyLoad] No element provided to observe');
    return;
  }

  if (state.observer) {
    const lazyElements = element.querySelectorAll(
      'img[data-src], img[data-lazy-src], picture:has(img[data-src]), picture:has(img[data-lazy-src])'
    );

    lazyElements.forEach((el) => {
      el.classList.add(CSS_CLASSES.LAZY);
      state.observer.observe(el);
    });

    logEvent('lazyload:observe:new', {
      elementCount: lazyElements.length,
    });
  } else {
    await loadAllImagesImmediately(element);
  }
}

/**
 * Force load a specific image immediately
 * @param {HTMLImageElement} img - Image element to load
 * @returns {Promise<void>}
 */
export async function forceLoadImage(img) {
  if (!img || img.tagName !== 'IMG') {
    throw new Error('[LazyLoad] Invalid image element provided');
  }

  if (state.observer) {
    state.observer.unobserve(img);
  }

  await loadImage(img);
}

/**
 * Cleanup lazy loading resources
 */
export function cleanup() {
  if (state.observer) {
    state.observer.disconnect();
    state.observer = null;
  }

  state.loadedImages = new WeakSet();
  state.performanceMarks.clear();
  state.initialized = false;

  logEvent('lazyload:cleanup', {
    timestamp: Date.now(),
  });
}

/**
 * Get lazy loading state
 * @returns {Object} Current state
 */
export function getLazyLoadingState() {
  return {
    initialized: state.initialized,
    supportsIntersectionObserver: state.supportsIntersectionObserver,
    hasObserver: state.observer !== null,
    loadedImageCount: 'WeakSet (count unavailable)',
  };
}

/**
 * Default export
 */
export default {
  initLazyLoading,
  observeNewImages,
  forceLoadImage,
  cleanup,
  getLazyLoadingState,
};