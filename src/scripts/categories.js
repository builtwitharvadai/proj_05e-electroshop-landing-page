/**
 * Categories Module
 * 
 * Implements categories functionality with lazy loading and interaction tracking.
 * Handles category data rendering, image lazy loading using Intersection Observer,
 * category click tracking, and keyboard navigation support with comprehensive
 * error handling for image loading failures.
 * 
 * @module scripts/categories
 * @generated-from task-id:TASK-004 sprint:categories-section
 * @modifies none
 * @dependencies [data/categories]
 */

import {
  getAllCategories,
  isValidCategory,
  getImageSources,
} from '../data/categories.js';

/**
 * Configuration for categories functionality
 * @type {Object}
 */
const CONFIG = Object.freeze({
  CONTAINER_SELECTOR: '#categories-grid',
  LAZY_LOAD_ROOT_MARGIN: '50px',
  LAZY_LOAD_THRESHOLD: 0.1,
  IMAGE_LOAD_TIMEOUT: 10000,
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY: 1000,
  ANIMATION_DELAY_INCREMENT: 50,
  KEYBOARD_NAVIGATION_ENABLED: true,
  TRACKING_ENABLED: true,
});

/**
 * State management for categories module
 * @type {Object}
 */
const state = {
  initialized: false,
  observer: null,
  loadedImages: new Set(),
  failedImages: new Set(),
  categoryElements: new Map(),
  interactionMetrics: {
    clicks: new Map(),
    hovers: new Map(),
    keyboardNavigations: 0,
  },
};

/**
 * Logger utility for structured logging
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 */
function log(level, message, context = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    module: 'categories',
    message,
    ...context,
  };

  if (level === 'error') {
    console.error(`[Categories] ${message}`, logEntry);
  } else if (level === 'warn') {
    console.warn(`[Categories] ${message}`, logEntry);
  } else {
    console.log(`[Categories] ${message}`, logEntry);
  }
}

/**
 * Create picture element with WebP and JPEG sources
 * @param {Object} imageData - Image data from category
 * @param {string} categoryId - Category identifier
 * @returns {HTMLPictureElement} Picture element
 */
function createPictureElement(imageData, categoryId) {
  const picture = document.createElement('picture');
  picture.className = 'category-card__picture';

  const sources = getImageSources(imageData);

  // WebP source
  const webpSource = document.createElement('source');
  webpSource.type = 'image/webp';
  webpSource.dataset.srcset = sources.webp;
  webpSource.srcset = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  picture.appendChild(webpSource);

  // JPEG source
  const jpegSource = document.createElement('source');
  jpegSource.type = 'image/jpeg';
  jpegSource.dataset.srcset = sources.jpeg;
  jpegSource.srcset = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  picture.appendChild(jpegSource);

  // Fallback img
  const img = document.createElement('img');
  img.className = 'category-card__image';
  img.dataset.src = sources.jpeg;
  img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  img.alt = sources.alt;
  img.loading = 'lazy';
  img.dataset.categoryId = categoryId;
  picture.appendChild(img);

  return picture;
}

/**
 * Load image with timeout and retry logic
 * @param {HTMLImageElement} img - Image element
 * @param {string} src - Image source URL
 * @param {number} attempt - Current attempt number
 * @returns {Promise<void>}
 */
function loadImageWithRetry(img, src, attempt = 1) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      img.src = '';
      reject(new Error(`Image load timeout after ${CONFIG.IMAGE_LOAD_TIMEOUT}ms`));
    }, CONFIG.IMAGE_LOAD_TIMEOUT);

    img.onload = () => {
      clearTimeout(timeout);
      resolve();
    };

    img.onerror = () => {
      clearTimeout(timeout);
      if (attempt < CONFIG.RETRY_ATTEMPTS) {
        setTimeout(() => {
          loadImageWithRetry(img, src, attempt + 1)
            .then(resolve)
            .catch(reject);
        }, CONFIG.RETRY_DELAY * attempt);
      } else {
        reject(new Error(`Failed to load image after ${attempt} attempts`));
      }
    };

    img.src = src;
  });
}

/**
 * Handle image lazy loading with Intersection Observer
 * @param {HTMLElement} picture - Picture element
 * @param {string} categoryId - Category identifier
 */
async function handleImageLazyLoad(picture, categoryId) {
  const img = picture.querySelector('img');
  const sources = picture.querySelectorAll('source');

  if (!img || state.loadedImages.has(categoryId)) {
    return;
  }

  try {
    // Load sources
    sources.forEach((source) => {
      if (source.dataset.srcset) {
        source.srcset = source.dataset.srcset;
        delete source.dataset.srcset;
      }
    });

    // Load image with retry
    const src = img.dataset.src;
    if (src) {
      await loadImageWithRetry(img, src);
      delete img.dataset.src;
      state.loadedImages.add(categoryId);

      log('info', 'Image loaded successfully', {
        categoryId,
        src,
      });
    }
  } catch (error) {
    state.failedImages.add(categoryId);
    img.alt = `${img.alt} (Image unavailable)`;
    img.classList.add('category-card__image--error');

    log('error', 'Image load failed', {
      categoryId,
      error: error.message,
      attempts: CONFIG.RETRY_ATTEMPTS,
    });
  }
}

/**
 * Create category card element
 * @param {Object} category - Category data
 * @param {number} index - Card index for animation delay
 * @returns {HTMLElement} Category card element
 */
function createCategoryCard(category, index) {
  const card = document.createElement('article');
  card.className = 'category-card';
  card.dataset.categoryId = category.id;
  card.style.animationDelay = `${index * CONFIG.ANIMATION_DELAY_INCREMENT}ms`;

  const link = document.createElement('a');
  link.href = category.link;
  link.className = 'category-card__link';
  link.setAttribute('aria-label', `Browse ${category.name} category`);

  // Picture element with lazy loading
  const picture = createPictureElement(category.image, category.id);
  link.appendChild(picture);

  // Content container
  const content = document.createElement('div');
  content.className = 'category-card__content';

  const title = document.createElement('h3');
  title.className = 'category-card__title';
  title.textContent = category.name;
  content.appendChild(title);

  const description = document.createElement('p');
  description.className = 'category-card__description';
  description.textContent = category.description;
  content.appendChild(description);

  if (category.productCount) {
    const count = document.createElement('span');
    count.className = 'category-card__count';
    count.textContent = `${category.productCount} products`;
    count.setAttribute('aria-label', `${category.productCount} products available`);
    content.appendChild(count);
  }

  link.appendChild(content);
  card.appendChild(link);

  return card;
}

/**
 * Track category interaction
 * @param {string} categoryId - Category identifier
 * @param {string} interactionType - Type of interaction
 */
function trackInteraction(categoryId, interactionType) {
  if (!CONFIG.TRACKING_ENABLED) {
    return;
  }

  const metrics = state.interactionMetrics[interactionType];
  if (metrics instanceof Map) {
    const count = metrics.get(categoryId) || 0;
    metrics.set(categoryId, count + 1);
  } else if (typeof metrics === 'number') {
    state.interactionMetrics[interactionType]++;
  }

  log('info', 'Category interaction tracked', {
    categoryId,
    interactionType,
    count: metrics instanceof Map ? metrics.get(categoryId) : metrics,
  });
}

/**
 * Handle category card click
 * @param {Event} event - Click event
 */
function handleCategoryClick(event) {
  const card = event.currentTarget.closest('.category-card');
  if (!card) {
    return;
  }

  const categoryId = card.dataset.categoryId;
  trackInteraction(categoryId, 'clicks');

  log('info', 'Category clicked', {
    categoryId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle category card hover
 * @param {Event} event - Mouse event
 */
function handleCategoryHover(event) {
  const card = event.currentTarget.closest('.category-card');
  if (!card) {
    return;
  }

  const categoryId = card.dataset.categoryId;
  trackInteraction(categoryId, 'hovers');
}

/**
 * Handle keyboard navigation
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleKeyboardNavigation(event) {
  if (!CONFIG.KEYBOARD_NAVIGATION_ENABLED) {
    return;
  }

  const card = event.target.closest('.category-card');
  if (!card) {
    return;
  }

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    const link = card.querySelector('.category-card__link');
    if (link) {
      link.click();
      state.interactionMetrics.keyboardNavigations++;
      log('info', 'Keyboard navigation used', {
        categoryId: card.dataset.categoryId,
        key: event.key,
      });
    }
  }
}

/**
 * Setup Intersection Observer for lazy loading
 * @returns {IntersectionObserver} Observer instance
 */
function setupIntersectionObserver() {
  const options = {
    root: null,
    rootMargin: CONFIG.LAZY_LOAD_ROOT_MARGIN,
    threshold: CONFIG.LAZY_LOAD_THRESHOLD,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const card = entry.target;
        const categoryId = card.dataset.categoryId;
        const picture = card.querySelector('.category-card__picture');

        if (picture && !state.loadedImages.has(categoryId)) {
          handleImageLazyLoad(picture, categoryId);
          observer.unobserve(card);
        }
      }
    });
  }, options);

  return observer;
}

/**
 * Attach event listeners to category cards
 * @param {HTMLElement} card - Category card element
 */
function attachCardEventListeners(card) {
  const link = card.querySelector('.category-card__link');
  if (!link) {
    return;
  }

  link.addEventListener('click', handleCategoryClick);
  link.addEventListener('mouseenter', handleCategoryHover);
  link.addEventListener('keydown', handleKeyboardNavigation);

  // Make card focusable for keyboard navigation
  link.setAttribute('tabindex', '0');
}

/**
 * Render categories grid
 * @param {HTMLElement} container - Container element
 * @param {Array} categories - Categories data
 */
function renderCategories(container, categories) {
  if (!container) {
    throw new Error('Container element not found');
  }

  if (!Array.isArray(categories) || categories.length === 0) {
    log('warn', 'No categories to render');
    container.innerHTML = '<p class="categories-empty">No categories available</p>';
    return;
  }

  // Clear existing content
  container.innerHTML = '';

  // Create and append category cards
  categories.forEach((category, index) => {
    if (!isValidCategory(category)) {
      log('warn', 'Invalid category data', { category });
      return;
    }

    const card = createCategoryCard(category, index);
    container.appendChild(card);
    state.categoryElements.set(category.id, card);

    // Attach event listeners
    attachCardEventListeners(card);

    // Observe for lazy loading
    if (state.observer) {
      state.observer.observe(card);
    }
  });

  log('info', 'Categories rendered', {
    count: categories.length,
    containerSelector: CONFIG.CONTAINER_SELECTOR,
  });
}

/**
 * Get interaction metrics
 * @returns {Object} Interaction metrics
 */
export function getInteractionMetrics() {
  return {
    clicks: Object.fromEntries(state.interactionMetrics.clicks),
    hovers: Object.fromEntries(state.interactionMetrics.hovers),
    keyboardNavigations: state.interactionMetrics.keyboardNavigations,
    loadedImages: state.loadedImages.size,
    failedImages: state.failedImages.size,
  };
}

/**
 * Cleanup categories module
 */
export function cleanup() {
  if (state.observer) {
    state.observer.disconnect();
    state.observer = null;
  }

  state.categoryElements.forEach((card) => {
    const link = card.querySelector('.category-card__link');
    if (link) {
      link.removeEventListener('click', handleCategoryClick);
      link.removeEventListener('mouseenter', handleCategoryHover);
      link.removeEventListener('keydown', handleKeyboardNavigation);
    }
  });

  state.categoryElements.clear();
  state.loadedImages.clear();
  state.failedImages.clear();
  state.initialized = false;

  log('info', 'Categories module cleaned up');
}

/**
 * Initialize categories module
 * @param {string} containerSelector - Container selector
 * @returns {Promise<void>}
 */
export async function initCategories(
  containerSelector = CONFIG.CONTAINER_SELECTOR
) {
  if (state.initialized) {
    log('warn', 'Categories already initialized');
    return;
  }

  try {
    log('info', 'Initializing categories module', { containerSelector });

    const container = document.querySelector(containerSelector);
    if (!container) {
      throw new Error(`Container not found: ${containerSelector}`);
    }

    // Setup Intersection Observer
    if ('IntersectionObserver' in window) {
      state.observer = setupIntersectionObserver();
    } else {
      log('warn', 'IntersectionObserver not supported, images will load immediately');
    }

    // Get and render categories
    const categories = getAllCategories();
    renderCategories(container, categories);

    state.initialized = true;

    log('info', 'Categories module initialized successfully', {
      categoriesCount: categories.length,
      observerEnabled: !!state.observer,
    });
  } catch (error) {
    log('error', 'Failed to initialize categories', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Default export for convenience
 */
export default {
  initCategories,
  getInteractionMetrics,
  cleanup,
};