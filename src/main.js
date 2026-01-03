/**
 * Main Application Entry Point
 * 
 * Initializes the ElectroShop landing page application by importing
 * core styles and setting up the module structure for future components.
 * 
 * @module main
 * @generated-from task-id:TASK-001 sprint:foundation
 * @modifies none
 * @dependencies ["@styles/main.css"]
 */

// Import main stylesheet
import '@/styles/main.css';

/**
 * Application initialization state
 * @private
 */
const APP_STATE = Object.freeze({
  INITIALIZING: Symbol('initializing'),
  READY: Symbol('ready'),
  ERROR: Symbol('error'),
});

/**
 * Current application state
 * @type {Symbol}
 */
let currentState = APP_STATE.INITIALIZING;

/**
 * Application configuration with sensible defaults
 * @private
 */
const config = Object.freeze({
  debug: import.meta.env.DEV,
  version: '1.0.0',
  environment: import.meta.env.MODE,
});

/**
 * Structured logger for application events
 * @private
 */
const logger = {
  /**
   * Log informational message
   * @param {string} message - Log message
   * @param {Object} [context={}] - Additional context
   */
  info(message, context = {}) {
    if (config.debug) {
      console.info('[ElectroShop]', message, context);
    }
  },

  /**
   * Log error with full context
   * @param {string} message - Error message
   * @param {Error} [error] - Error object
   * @param {Object} [context={}] - Additional context
   */
  error(message, error, context = {}) {
    console.error('[ElectroShop Error]', message, {
      ...context,
      error: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {Object} [context={}] - Additional context
   */
  warn(message, context = {}) {
    if (config.debug) {
      console.warn('[ElectroShop Warning]', message, context);
    }
  },
};

/**
 * Initialize application modules and components
 * @private
 * @returns {Promise<void>}
 */
async function initializeApp() {
  try {
    logger.info('Application initialization started', {
      version: config.version,
      environment: config.environment,
    });

    // Validate DOM is ready
    if (document.readyState === 'loading') {
      await new Promise((resolve) => {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }

    // Initialize performance monitoring module
    try {
      const { initPerformanceMonitoring } = await import('@/scripts/performance.js');
      await initPerformanceMonitoring({
        reportingEnabled: config.environment === 'production',
      });
      logger.info('Performance monitoring initialized successfully');
    } catch (error) {
      logger.error(
        'Performance monitoring initialization failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          module: 'performance',
        }
      );
      // Continue initialization - performance monitoring failure shouldn't block app
    }

    // Initialize lazy loading module
    try {
      const { initLazyLoading } = await import('@/scripts/lazy-loading.js');
      await initLazyLoading('body');
      logger.info('Lazy loading initialized successfully');
    } catch (error) {
      logger.error(
        'Lazy loading initialization failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          module: 'lazy-loading',
        }
      );
      // Continue initialization - lazy loading failure shouldn't block app
    }

    // Initialize SEO module
    try {
      const { initializeSEO } = await import('@/scripts/seo.js');
      await initializeSEO();
      logger.info('SEO module initialized successfully');
    } catch (error) {
      logger.error(
        'SEO module initialization failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          module: 'seo',
        }
      );
      // Continue initialization - SEO failure shouldn't block app
    }

    // Initialize navigation module
    try {
      const { initializeNavigation } = await import('@/scripts/navigation.js');
      await initializeNavigation();
      logger.info('Navigation module initialized successfully');
    } catch (error) {
      logger.error(
        'Navigation module initialization failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          module: 'navigation',
        }
      );
      // Continue initialization - navigation failure shouldn't block app
    }

    // Initialize hero section module
    try {
      const { initHero } = await import('@/scripts/hero.js');
      const heroContainer = document.querySelector('.hero');
      
      if (heroContainer) {
        await initHero(heroContainer);
        logger.info('Hero section initialized successfully');
      } else {
        logger.warn('Hero container not found in DOM', {
          module: 'hero',
        });
      }
    } catch (error) {
      logger.error(
        'Hero section initialization failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          module: 'hero',
        }
      );
      // Continue initialization - hero failure shouldn't block app
    }

    // Initialize categories section module
    try {
      const { initCategories } = await import('@/scripts/categories.js');
      const categoriesContainer = document.querySelector('#categories-grid');
      
      if (categoriesContainer) {
        await initCategories('#categories-grid');
        logger.info('Categories section initialized successfully');
      } else {
        logger.warn('Categories container not found in DOM', {
          module: 'categories',
        });
      }
    } catch (error) {
      logger.error(
        'Categories section initialization failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          module: 'categories',
        }
      );
      // Continue initialization - categories failure shouldn't block app
    }

    // Initialize store information module
    try {
      const { initStoreInfo } = await import('@/scripts/store-info.js');
      await initStoreInfo();
      logger.info('Store information module initialized successfully');
    } catch (error) {
      logger.error(
        'Store information module initialization failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          module: 'store-info',
        }
      );
      // Continue initialization - store info failure shouldn't block app
    }

    // Initialize contact form module
    try {
      const { initContactForm } = await import('@/scripts/contact-form.js');
      await initContactForm();
      logger.info('Contact form module initialized successfully');
    } catch (error) {
      logger.error(
        'Contact form module initialization failed',
        error instanceof Error ? error : new Error(String(error)),
        {
          module: 'contact-form',
        }
      );
      // Continue initialization - contact form failure shouldn't block app
    }

    // Future module imports will be added here
    // Example structure for future components:
    // const { initHeader } = await import('@/scripts/components/header.js');
    // const { initProducts } = await import('@/scripts/components/products.js');
    // await Promise.all([initHeader(), initProducts()]);

    currentState = APP_STATE.READY;

    logger.info('Application initialized successfully', {
      state: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    currentState = APP_STATE.ERROR;

    logger.error(
      'Application initialization failed',
      error instanceof Error ? error : new Error(String(error)),
      {
        state: 'error',
        timestamp: new Date().toISOString(),
      }
    );

    // Graceful degradation - application continues with basic functionality
    // Error boundary prevents complete application failure
  }
}

/**
 * Get current application state
 * @returns {Symbol} Current state
 */
export function getAppState() {
  return currentState;
}

/**
 * Check if application is ready
 * @returns {boolean} True if application is ready
 */
export function isAppReady() {
  return currentState === APP_STATE.READY;
}

/**
 * Get application configuration
 * @returns {Object} Application configuration (frozen)
 */
export function getConfig() {
  return config;
}

// Initialize application
initializeApp();

// Hot Module Replacement support for development
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    logger.info('Hot module replacement triggered', {
      timestamp: new Date().toISOString(),
    });
  });
}