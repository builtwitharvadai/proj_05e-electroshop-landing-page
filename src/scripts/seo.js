/**
 * SEO Management Module
 * 
 * Provides dynamic SEO management including meta tag updates, structured data
 * injection, Open Graph tag management, and XML sitemap generation. Implements
 * validation for structured data and ensures proper SEO optimization for the
 * ElectroShop landing page.
 * 
 * @module scripts/seo
 * @generated-from task-id:TASK-006 sprint:performance-seo
 * @modifies index.html (meta tags, structured data)
 * @dependencies [src/data/seo-metadata.js]
 */

import {
  getSEOMetadata,
  getPageMetadata,
  getOpenGraphMetadata,
  getTwitterCardMetadata,
  getOrganizationStructuredData,
  getProductStructuredData,
  getBreadcrumbStructuredData,
  getCanonicalConfig,
  getRobotsConfig,
  getAlternateLanguages,
  updateProductStructuredData,
  validateSEOMetadata,
} from '../data/seo-metadata.js';

/**
 * SEO Manager class for handling all SEO-related operations
 * @class
 */
class SEOManager {
  /**
   * Initialize SEO Manager
   */
  constructor() {
    this.metadata = getSEOMetadata();
    this.initialized = false;
    this.validationResult = null;
    this.structuredDataElements = new Map();
    this.metaTagElements = new Map();
    
    this._logContext = {
      module: 'seo-manager',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Initialize SEO management system
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      this._log('info', 'Initializing SEO management system');

      // Validate SEO metadata
      this.validationResult = validateSEOMetadata();
      
      if (!this.validationResult.valid) {
        this._log('error', 'SEO metadata validation failed', {
          errors: this.validationResult.errors,
        });
        throw new Error(`SEO validation failed: ${this.validationResult.errors.join(', ')}`);
      }

      if (this.validationResult.warnings.length > 0) {
        this._log('warn', 'SEO metadata has warnings', {
          warnings: this.validationResult.warnings,
        });
      }

      // Update meta tags
      this._updateMetaTags();

      // Update canonical URL
      this._updateCanonicalURL();

      // Update alternate language links
      this._updateAlternateLanguages();

      // Inject structured data
      this._injectStructuredData();

      // Generate and inject sitemap reference
      this._injectSitemapReference();

      this.initialized = true;
      this._log('info', 'SEO management system initialized successfully');
    } catch (error) {
      this._log('error', 'Failed to initialize SEO management system', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Update all meta tags in document head
   * @private
   */
  _updateMetaTags() {
    try {
      const pageMetadata = getPageMetadata();
      const ogMetadata = getOpenGraphMetadata();
      const twitterMetadata = getTwitterCardMetadata();
      const robotsConfig = getRobotsConfig();

      // Update or create basic meta tags
      this._setMetaTag('description', pageMetadata.description);
      this._setMetaTag('keywords', pageMetadata.keywords.join(', '));
      this._setMetaTag('author', pageMetadata.author);
      this._setMetaTag('theme-color', pageMetadata.themeColor);
      this._setMetaTag('viewport', pageMetadata.viewport);

      // Update robots meta tag
      const robotsContent = Object.entries(robotsConfig)
        .filter(([key, value]) => {
          if (typeof value === 'boolean') return value;
          if (typeof value === 'number') return value !== -1;
          return false;
        })
        .map(([key, value]) => {
          if (typeof value === 'number' && value !== -1) {
            return `${key}:${value}`;
          }
          return key;
        })
        .join(', ');

      if (robotsContent) {
        this._setMetaTag('robots', robotsContent);
      }

      // Update Open Graph tags
      this._setMetaProperty('og:title', ogMetadata.title);
      this._setMetaProperty('og:description', ogMetadata.description);
      this._setMetaProperty('og:type', ogMetadata.type);
      this._setMetaProperty('og:url', ogMetadata.url);
      this._setMetaProperty('og:image', ogMetadata.image);
      this._setMetaProperty('og:image:alt', ogMetadata.imageAlt);
      this._setMetaProperty('og:image:width', ogMetadata.imageWidth);
      this._setMetaProperty('og:image:height', ogMetadata.imageHeight);
      this._setMetaProperty('og:site_name', ogMetadata.siteName);
      this._setMetaProperty('og:locale', ogMetadata.locale);

      // Update Twitter Card tags
      this._setMetaTag('twitter:card', twitterMetadata.card, 'name');
      this._setMetaTag('twitter:site', twitterMetadata.site, 'name');
      this._setMetaTag('twitter:creator', twitterMetadata.creator, 'name');
      this._setMetaTag('twitter:title', twitterMetadata.title, 'name');
      this._setMetaTag('twitter:description', twitterMetadata.description, 'name');
      this._setMetaTag('twitter:image', twitterMetadata.image, 'name');
      this._setMetaTag('twitter:image:alt', twitterMetadata.imageAlt, 'name');

      // Update page title
      document.title = pageMetadata.title;

      this._log('info', 'Meta tags updated successfully', {
        tagsCount: this.metaTagElements.size,
      });
    } catch (error) {
      this._log('error', 'Failed to update meta tags', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Set or update a meta tag
   * @param {string} name - Meta tag name
   * @param {string} content - Meta tag content
   * @param {string} [attribute='name'] - Attribute to use (name or property)
   * @private
   */
  _setMetaTag(name, content, attribute = 'name') {
    try {
      // Sanitize content to prevent XSS
      const sanitizedContent = this._sanitizeContent(content);
      
      let metaTag = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute(attribute, name);
        document.head.appendChild(metaTag);
      }
      
      metaTag.setAttribute('content', sanitizedContent);
      this.metaTagElements.set(name, metaTag);
    } catch (error) {
      this._log('error', 'Failed to set meta tag', {
        name,
        error: error.message,
      });
    }
  }

  /**
   * Set or update a meta property tag (for Open Graph)
   * @param {string} property - Meta property name
   * @param {string} content - Meta property content
   * @private
   */
  _setMetaProperty(property, content) {
    this._setMetaTag(property, content, 'property');
  }

  /**
   * Update canonical URL
   * @private
   */
  _updateCanonicalURL() {
    try {
      const canonicalConfig = getCanonicalConfig();
      const currentPath = window.location.pathname;
      
      let canonicalURL = canonicalConfig.url;
      
      if (currentPath !== '/') {
        canonicalURL = `${canonicalConfig.url}${currentPath}`;
      }

      let linkTag = document.querySelector('link[rel="canonical"]');
      
      if (!linkTag) {
        linkTag = document.createElement('link');
        linkTag.setAttribute('rel', 'canonical');
        document.head.appendChild(linkTag);
      }
      
      linkTag.setAttribute('href', canonicalURL);

      this._log('info', 'Canonical URL updated', { url: canonicalURL });
    } catch (error) {
      this._log('error', 'Failed to update canonical URL', {
        error: error.message,
      });
    }
  }

  /**
   * Update alternate language links
   * @private
   */
  _updateAlternateLanguages() {
    try {
      const alternateLanguages = getAlternateLanguages();

      // Remove existing alternate language links
      document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((link) => {
        link.remove();
      });

      // Add new alternate language links
      alternateLanguages.forEach((lang) => {
        const linkTag = document.createElement('link');
        linkTag.setAttribute('rel', 'alternate');
        linkTag.setAttribute('hreflang', lang.hreflang);
        linkTag.setAttribute('href', lang.href);
        document.head.appendChild(linkTag);
      });

      this._log('info', 'Alternate language links updated', {
        count: alternateLanguages.length,
      });
    } catch (error) {
      this._log('error', 'Failed to update alternate language links', {
        error: error.message,
      });
    }
  }

  /**
   * Inject structured data (JSON-LD) into document
   * @private
   */
  _injectStructuredData() {
    try {
      // Remove existing structured data scripts
      document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
        if (this.structuredDataElements.has(script.id)) {
          script.remove();
        }
      });
      this.structuredDataElements.clear();

      // Inject organization structured data
      const orgData = getOrganizationStructuredData();
      this._injectStructuredDataScript('organization', orgData);

      // Inject breadcrumb structured data
      const breadcrumbData = getBreadcrumbStructuredData();
      this._injectStructuredDataScript('breadcrumb', breadcrumbData);

      // Inject product structured data if available
      const productData = getProductStructuredData();
      if (productData.itemListElement.length > 0) {
        this._injectStructuredDataScript('products', productData);
      }

      this._log('info', 'Structured data injected successfully', {
        scriptsCount: this.structuredDataElements.size,
      });
    } catch (error) {
      this._log('error', 'Failed to inject structured data', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Inject a structured data script
   * @param {string} id - Unique identifier for the script
   * @param {Object} data - Structured data object
   * @private
   */
  _injectStructuredDataScript(id, data) {
    try {
      // Validate structured data
      if (!this._validateStructuredData(data)) {
        this._log('warn', 'Invalid structured data detected', { id });
        return;
      }

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = `structured-data-${id}`;
      script.textContent = JSON.stringify(data, null, 2);
      
      document.head.appendChild(script);
      this.structuredDataElements.set(script.id, script);

      this._log('debug', 'Structured data script injected', { id });
    } catch (error) {
      this._log('error', 'Failed to inject structured data script', {
        id,
        error: error.message,
      });
    }
  }

  /**
   * Validate structured data format
   * @param {Object} data - Structured data to validate
   * @returns {boolean} True if valid
   * @private
   */
  _validateStructuredData(data) {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check for required @context and @type
    if (!data['@context'] || !data['@type']) {
      return false;
    }

    // Validate @context is schema.org
    if (!data['@context'].includes('schema.org')) {
      return false;
    }

    return true;
  }

  /**
   * Inject sitemap reference
   * @private
   */
  _injectSitemapReference() {
    try {
      let linkTag = document.querySelector('link[rel="sitemap"]');
      
      if (!linkTag) {
        linkTag = document.createElement('link');
        linkTag.setAttribute('rel', 'sitemap');
        linkTag.setAttribute('type', 'application/xml');
        document.head.appendChild(linkTag);
      }
      
      linkTag.setAttribute('href', '/sitemap.xml');

      this._log('info', 'Sitemap reference injected');
    } catch (error) {
      this._log('error', 'Failed to inject sitemap reference', {
        error: error.message,
      });
    }
  }

  /**
   * Update product structured data dynamically
   * @param {Array<Object>} products - Array of product objects
   * @returns {void}
   */
  updateProducts(products) {
    try {
      if (!Array.isArray(products)) {
        throw new TypeError('Products must be an array');
      }

      this._log('info', 'Updating product structured data', {
        productsCount: products.length,
      });

      // Update product structured data in metadata
      updateProductStructuredData(products);

      // Re-inject product structured data
      const productData = getProductStructuredData();
      
      // Remove existing product structured data
      const existingScript = this.structuredDataElements.get('structured-data-products');
      if (existingScript) {
        existingScript.remove();
        this.structuredDataElements.delete('structured-data-products');
      }

      // Inject updated product structured data
      if (productData.itemListElement.length > 0) {
        this._injectStructuredDataScript('products', productData);
      }

      this._log('info', 'Product structured data updated successfully');
    } catch (error) {
      this._log('error', 'Failed to update product structured data', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Generate XML sitemap content
   * @returns {string} XML sitemap content
   */
  generateSitemap() {
    try {
      const canonicalConfig = getCanonicalConfig();
      const baseURL = canonicalConfig.url;
      const currentDate = new Date().toISOString().split('T')[0];

      const urls = [
        {
          loc: baseURL,
          lastmod: currentDate,
          changefreq: 'daily',
          priority: '1.0',
        },
      ];

      const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
      const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
      const urlsetClose = '</urlset>';

      const urlElements = urls
        .map((url) => {
          return `
  <url>
    <loc>${this._sanitizeXML(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`;
        })
        .join('');

      const sitemap = `${xmlHeader}\n${urlsetOpen}${urlElements}\n${urlsetClose}`;

      this._log('info', 'Sitemap generated successfully', {
        urlsCount: urls.length,
      });

      return sitemap;
    } catch (error) {
      this._log('error', 'Failed to generate sitemap', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Sanitize content to prevent XSS attacks
   * @param {string} content - Content to sanitize
   * @returns {string} Sanitized content
   * @private
   */
  _sanitizeContent(content) {
    if (typeof content !== 'string') {
      return String(content);
    }

    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Sanitize XML content
   * @param {string} content - Content to sanitize
   * @returns {string} Sanitized XML content
   * @private
   */
  _sanitizeXML(content) {
    if (typeof content !== 'string') {
      return String(content);
    }

    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Log message with context
   * @param {string} level - Log level (info, warn, error, debug)
   * @param {string} message - Log message
   * @param {Object} [context={}] - Additional context
   * @private
   */
  _log(level, message, context = {}) {
    const logEntry = {
      ...this._logContext,
      level,
      message,
      ...context,
      timestamp: new Date().toISOString(),
    };

    const logMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    console[logMethod](`[SEO Manager] ${message}`, logEntry);
  }

  /**
   * Get validation result
   * @returns {Object|null} Validation result
   */
  getValidationResult() {
    return this.validationResult;
  }

  /**
   * Check if SEO manager is initialized
   * @returns {boolean} True if initialized
   */
  isInitialized() {
    return this.initialized;
  }
}

// Create singleton instance
const seoManager = new SEOManager();

/**
 * Initialize SEO management system
 * @returns {Promise<void>}
 */
export async function initializeSEO() {
  try {
    await seoManager.initialize();
  } catch (error) {
    console.error('[SEO] Failed to initialize SEO management:', error);
    throw error;
  }
}

/**
 * Update product structured data
 * @param {Array<Object>} products - Array of product objects
 * @returns {void}
 */
export function updateProductSEO(products) {
  seoManager.updateProducts(products);
}

/**
 * Generate XML sitemap
 * @returns {string} XML sitemap content
 */
export function generateXMLSitemap() {
  return seoManager.generateSitemap();
}

/**
 * Get SEO validation result
 * @returns {Object|null} Validation result
 */
export function getSEOValidation() {
  return seoManager.getValidationResult();
}

/**
 * Check if SEO is initialized
 * @returns {boolean} True if initialized
 */
export function isSEOInitialized() {
  return seoManager.isInitialized();
}

/**
 * Export SEO manager instance for advanced usage
 */
export { seoManager };

/**
 * Default export
 */
export default {
  initializeSEO,
  updateProductSEO,
  generateXMLSitemap,
  getSEOValidation,
  isSEOInitialized,
  seoManager,
};