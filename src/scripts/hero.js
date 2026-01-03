/**
 * Hero Section Module
 * 
 * Implements hero section functionality including lazy loading of images using
 * Intersection Observer API, CTA button click tracking, product data rendering,
 * and responsive image selection based on viewport size and browser support.
 * 
 * @module scripts/hero
 * @generated-from task-id:TASK-003 sprint:hero-section
 * @modifies none
 * @dependencies [data/products]
 */

import {
  getFeaturedProducts,
  formatPrice,
  getImageSources,
  isValidProduct,
} from '../data/products.js';

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
 * Performance timing thresholds
 * @type {Object}
 */
const PERFORMANCE_THRESHOLDS = Object.freeze({
  IMAGE_LOAD_WARNING: 2000, // 2 seconds
  IMAGE_LOAD_ERROR: 5000, // 5 seconds
});

/**
 * Event types for tracking
 * @type {Object}
 */
const EVENTS = Object.freeze({
  IMAGE_LOAD_START: 'hero:image:load:start',
  IMAGE_LOAD_SUCCESS: 'hero:image:load:success',
  IMAGE_LOAD_ERROR: 'hero:image:load:error',
  CTA_CLICK: 'hero:cta:click',
  PRODUCT_VIEW: 'hero:product:view',
  HERO_INIT: 'hero:init',
});

/**
 * Global state for hero section
 * @type {Object}
 */
const state = {
  observer: null,
  loadedImages: new WeakSet(),
  performanceMarks: new Map(),
  initialized: false,
};

/**
 * Check if browser supports WebP format
 * @returns {Promise<boolean>} True if WebP is supported
 */
async function supportsWebP() {
  if (!window.createImageBitmap) {
    return false;
  }

  const webpData =
    'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoCAAEAAQAcJaQAA3AA/v3AgAA=';

  try {
    const blob = await fetch(webpData).then((r) => r.blob());
    return await createImageBitmap(blob).then(
      () => true,
      () => false
    );
  } catch (_error) {
    return false;
  }
}

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
    console.log('[Hero]', logEntry);
  }

  // Dispatch custom event for analytics integration
  window.dispatchEvent(
    new CustomEvent('hero:analytics', {
      detail: logEntry,
    })
  );
}

/**
 * Track performance metric
 * @param {string} metricName - Metric identifier
 * @param {number} value - Metric value
 * @param {Object} metadata - Additional metadata
 */
function trackPerformance(metricName, value, metadata = {}) {
  if (window.performance && window.performance.mark) {
    performance.mark(`hero:${metricName}`);
  }

  logEvent('hero:performance', {
    metric: metricName,
    value,
    unit: 'ms',
    ...metadata,
  });

  // Check against thresholds
  if (
    metricName === 'image_load' &&
    value > PERFORMANCE_THRESHOLDS.IMAGE_LOAD_WARNING
  ) {
    console.warn(
      `[Hero] Image load time (${value}ms) exceeds warning threshold (${PERFORMANCE_THRESHOLDS.IMAGE_LOAD_WARNING}ms)`,
      metadata
    );
  }
}

/**
 * Create picture element with responsive sources
 * @param {Object} product - Product data
 * @param {boolean} useWebP - Whether to use WebP format
 * @returns {HTMLPictureElement} Picture element
 */
function createPictureElement(product, useWebP) {
  const picture = document.createElement('picture');
  const imageSources = getImageSources(product.images.hero);

  // Add WebP source if supported
  if (useWebP && imageSources.webp) {
    const webpSource = document.createElement('source');
    webpSource.type = 'image/webp';
    webpSource.dataset.srcset = imageSources.webp;
    picture.appendChild(webpSource);
  }

  // Add JPEG fallback
  const img = document.createElement('img');
  img.dataset.src = imageSources.jpeg;
  img.alt = imageSources.alt;
  img.className = 'product-card__image';
  img.loading = 'lazy';
  img.decoding = 'async';

  // Add data attributes for tracking
  img.dataset.productId = product.id;
  img.dataset.productName = product.name;

  picture.appendChild(img);

  return picture;
}

/**
 * Create product specification list
 * @param {Array} specifications - Product specifications
 * @returns {HTMLElement} Specification list element
 */
function createSpecificationList(specifications) {
  const list = document.createElement('ul');
  list.className = 'product-card__specs';
  list.setAttribute('aria-label', 'Product specifications');

  specifications.slice(0, 4).forEach((spec) => {
    const item = document.createElement('li');
    item.className = 'product-card__spec-item';

    const label = document.createElement('span');
    label.className = 'product-card__spec-label';
    label.textContent = spec.label;

    const value = document.createElement('span');
    value.className = 'product-card__spec-value';
    value.textContent = spec.value;

    item.appendChild(label);
    item.appendChild(value);
    list.appendChild(item);
  });

  return list;
}

/**
 * Create CTA button with tracking
 * @param {Object} product - Product data
 * @returns {HTMLAnchorElement} CTA button element
 */
function createCtaButton(product) {
  const button = document.createElement('a');
  button.href = product.ctaLink;
  button.className = 'product-card__cta';
  button.textContent = product.ctaText;
  button.setAttribute('aria-label', `${product.ctaText} - ${product.name}`);

  // Add click tracking
  button.addEventListener('click', (event) => {
    logEvent(EVENTS.CTA_CLICK, {
      productId: product.id,
      productName: product.name,
      ctaText: product.ctaText,
      ctaLink: product.ctaLink,
      timestamp: Date.now(),
    });

    // Track conversion metric
    trackPerformance('cta_click', Date.now(), {
      productId: product.id,
    });
  });

  return button;
}

/**
 * Create product card element
 * @param {Object} product - Product data
 * @param {boolean} useWebP - Whether to use WebP format
 * @returns {HTMLElement} Product card element
 */
function createProductCard(product, useWebP) {
  if (!isValidProduct(product)) {
    console.error('[Hero] Invalid product data:', product);
    return null;
  }

  const card = document.createElement('article');
  card.className = 'product-card';
  card.dataset.productId = product.id;
  card.setAttribute('aria-label', `${product.name} product card`);

  // Create image container
  const imageContainer = document.createElement('div');
  imageContainer.className = 'product-card__image-container';
  const picture = createPictureElement(product, useWebP);
  imageContainer.appendChild(picture);

  // Create content container
  const content = document.createElement('div');
  content.className = 'product-card__content';

  // Category badge
  const category = document.createElement('span');
  category.className = 'product-card__category';
  category.textContent = product.category;

  // Product name
  const name = document.createElement('h3');
  name.className = 'product-card__name';
  name.textContent = product.name;

  // Product description
  const description = document.createElement('p');
  description.className = 'product-card__description';
  description.textContent = product.description;

  // Price
  const price = document.createElement('div');
  price.className = 'product-card__price';
  price.textContent = formatPrice(product);
  price.setAttribute('aria-label', `Price: ${formatPrice(product)}`);

  // Specifications
  const specs = createSpecificationList(product.specifications);

  // CTA button
  const cta = createCtaButton(product);

  // Assemble card
  content.appendChild(category);
  content.appendChild(name);
  content.appendChild(description);
  content.appendChild(price);
  content.appendChild(specs);
  content.appendChild(cta);

  card.appendChild(imageContainer);
  card.appendChild(content);

  return card;
}

/**
 * Load image with performance tracking
 * @param {HTMLImageElement} img - Image element
 * @returns {Promise<void>}
 */
function loadImage(img) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    const productId = img.dataset.productId;

    logEvent(EVENTS.IMAGE_LOAD_START, {
      productId,
      src: img.dataset.src,
    });

    const onLoad = () => {
      const loadTime = performance.now() - startTime;

      trackPerformance('image_load', loadTime, {
        productId,
        src: img.src,
      });

      logEvent(EVENTS.IMAGE_LOAD_SUCCESS, {
        productId,
        src: img.src,
        loadTime,
      });

      state.loadedImages.add(img);
      cleanup();
      resolve();
    };

    const onError = (error) => {
      const loadTime = performance.now() - startTime;

      logEvent(EVENTS.IMAGE_LOAD_ERROR, {
        productId,
        src: img.dataset.src,
        error: error.message || 'Image load failed',
        loadTime,
      });

      cleanup();
      reject(new Error(`Failed to load image: ${img.dataset.src}`));
    };

    const cleanup = () => {
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
    };

    img.addEventListener('load', onLoad);
    img.addEventListener('error', onError);

    // Set src to trigger load
    if (img.dataset.src) {
      img.src = img.dataset.src;
    }

    // Handle source elements in picture
    const picture = img.parentElement;
    if (picture && picture.tagName === 'PICTURE') {
      const sources = picture.querySelectorAll('source[data-srcset]');
      sources.forEach((source) => {
        source.srcset = source.dataset.srcset;
      });
    }

    // Timeout fallback
    setTimeout(() => {
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
      const img = entry.target;

      // Skip if already loaded
      if (state.loadedImages.has(img)) {
        return;
      }

      // Load image
      loadImage(img).catch((error) => {
        console.error('[Hero] Image load error:', error);
        // Set fallback or placeholder if needed
        img.alt = `${img.alt} (failed to load)`;
      });

      // Stop observing this image
      if (state.observer) {
        state.observer.unobserve(img);
      }

      // Track product view
      logEvent(EVENTS.PRODUCT_VIEW, {
        productId: img.dataset.productId,
        productName: img.dataset.productName,
        timestamp: Date.now(),
      });
    }
  });
}

/**
 * Initialize Intersection Observer
 * @returns {IntersectionObserver} Observer instance
 */
function initializeObserver() {
  if (!('IntersectionObserver' in window)) {
    console.warn(
      '[Hero] IntersectionObserver not supported, loading all images immediately'
    );
    return null;
  }

  return new IntersectionObserver(handleIntersection, OBSERVER_CONFIG);
}

/**
 * Render hero section with featured products
 * @param {HTMLElement} container - Container element
 * @returns {Promise<void>}
 */
async function renderHeroSection(container) {
  if (!container) {
    throw new Error('[Hero] Container element is required');
  }

  const startTime = performance.now();

  try {
    // Check WebP support
    const webpSupported = await supportsWebP();

    logEvent(EVENTS.HERO_INIT, {
      webpSupported,
      containerSelector: container.id || container.className,
    });

    // Get featured products
    const products = getFeaturedProducts();

    if (products.length === 0) {
      console.warn('[Hero] No featured products found');
      container.innerHTML =
        '<p class="hero__empty">No featured products available</p>';
      return;
    }

    // Create product cards
    const fragment = document.createDocumentFragment();

    products.forEach((product) => {
      const card = createProductCard(product, webpSupported);
      if (card) {
        fragment.appendChild(card);
      }
    });

    // Clear container and append cards
    container.innerHTML = '';
    container.appendChild(fragment);

    // Initialize lazy loading
    state.observer = initializeObserver();

    if (state.observer) {
      // Observe all images
      const images = container.querySelectorAll('img[data-src]');
      images.forEach((img) => {
        state.observer.observe(img);
      });
    } else {
      // Fallback: load all images immediately
      const images = container.querySelectorAll('img[data-src]');
      await Promise.allSettled(Array.from(images).map(loadImage));
    }

    const renderTime = performance.now() - startTime;
    trackPerformance('hero_render', renderTime, {
      productCount: products.length,
      webpSupported,
    });

    state.initialized = true;
  } catch (error) {
    console.error('[Hero] Failed to render hero section:', error);
    logEvent('hero:error', {
      error: error.message,
      stack: error.stack,
    });

    // Display error message to user
    container.innerHTML = `
      <div class="hero__error" role="alert">
        <p>Unable to load featured products. Please try again later.</p>
      </div>
    `;

    throw error;
  }
}

/**
 * Cleanup hero section resources
 */
function cleanup() {
  if (state.observer) {
    state.observer.disconnect();
    state.observer = null;
  }

  state.loadedImages = new WeakSet();
  state.performanceMarks.clear();
  state.initialized = false;

  logEvent('hero:cleanup', {
    timestamp: Date.now(),
  });
}

/**
 * Initialize hero section
 * @param {string|HTMLElement} containerSelector - Container selector or element
 * @returns {Promise<void>}
 */
export async function initHero(containerSelector) {
  if (state.initialized) {
    console.warn('[Hero] Hero section already initialized');
    return;
  }

  const container =
    typeof containerSelector === 'string'
      ? document.querySelector(containerSelector)
      : containerSelector;

  if (!container) {
    throw new Error(
      `[Hero] Container not found: ${containerSelector}`
    );
  }

  await renderHeroSection(container);
}

/**
 * Refresh hero section with new products
 * @param {string|HTMLElement} containerSelector - Container selector or element
 * @returns {Promise<void>}
 */
export async function refreshHero(containerSelector) {
  cleanup();
  await initHero(containerSelector);
}

/**
 * Get hero section state
 * @returns {Object} Current state
 */
export function getHeroState() {
  return {
    initialized: state.initialized,
    hasObserver: state.observer !== null,
    loadedImageCount: state.loadedImages ? 'WeakSet (count unavailable)' : 0,
  };
}

/**
 * Export cleanup function
 */
export { cleanup as cleanupHero };

/**
 * Default export
 */
export default {
  initHero,
  refreshHero,
  cleanupHero: cleanup,
  getHeroState,
};