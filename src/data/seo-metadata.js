/**
 * SEO Metadata Module
 * 
 * Provides comprehensive SEO metadata including page titles, meta descriptions,
 * Open Graph tags, Twitter Card data, and JSON-LD structured data for the
 * ElectroShop electronics store landing page. Supports canonical URLs and
 * social media optimization.
 * 
 * @module data/seo-metadata
 * @generated-from task-id:TASK-006 sprint:performance-seo
 * @modifies none
 * @dependencies []
 */

/**
 * Open Graph metadata structure
 * @typedef {Object} OpenGraphData
 * @property {string} title - OG title
 * @property {string} description - OG description
 * @property {string} type - OG type (website, article, etc.)
 * @property {string} url - Canonical URL
 * @property {string} image - OG image URL
 * @property {string} imageAlt - OG image alt text
 * @property {string} siteName - Site name
 * @property {string} locale - Content locale
 */

/**
 * Twitter Card metadata structure
 * @typedef {Object} TwitterCardData
 * @property {string} card - Card type (summary, summary_large_image, etc.)
 * @property {string} site - Twitter site handle
 * @property {string} creator - Twitter creator handle
 * @property {string} title - Twitter card title
 * @property {string} description - Twitter card description
 * @property {string} image - Twitter card image URL
 * @property {string} imageAlt - Twitter card image alt text
 */

/**
 * JSON-LD structured data for organization
 * @typedef {Object} OrganizationStructuredData
 * @property {string} @context - Schema.org context
 * @property {string} @type - Schema type
 * @property {string} name - Organization name
 * @property {string} description - Organization description
 * @property {string} url - Organization URL
 * @property {string} logo - Logo URL
 * @property {Object} contactPoint - Contact information
 * @property {Object} address - Physical address
 * @property {Array<string>} sameAs - Social media profiles
 */

/**
 * JSON-LD structured data for products
 * @typedef {Object} ProductStructuredData
 * @property {string} @context - Schema.org context
 * @property {string} @type - Schema type (ItemList)
 * @property {Array<Object>} itemListElement - Product items
 */

/**
 * Complete SEO metadata structure
 * @typedef {Object} SEOMetadata
 * @property {Object} page - Page-level metadata
 * @property {OpenGraphData} openGraph - Open Graph tags
 * @property {TwitterCardData} twitter - Twitter Card tags
 * @property {OrganizationStructuredData} structuredData - Organization structured data
 * @property {ProductStructuredData} productStructuredData - Product structured data
 * @property {Object} canonical - Canonical URL configuration
 * @property {Object} robots - Robots meta tag configuration
 */

/**
 * Base URL for the website
 * @constant {string}
 */
const BASE_URL = 'https://www.electroshop.com';

/**
 * Default image for social sharing
 * @constant {string}
 */
const DEFAULT_OG_IMAGE = `${BASE_URL}/images/og-image.jpg`;

/**
 * SEO metadata configuration
 * @type {SEOMetadata}
 */
const seoMetadata = {
  page: {
    title: 'ElectroShop - Premium Electronics & Latest Technology | San Francisco',
    titleTemplate: '%s | ElectroShop',
    description:
      'Discover the latest smartphones, laptops, tablets, and electronics at ElectroShop San Francisco. Premium brands, expert advice, and exceptional service since 2010. Free shipping on orders over $50.',
    keywords: [
      'electronics store',
      'smartphones',
      'laptops',
      'tablets',
      'accessories',
      'San Francisco',
      'Apple',
      'Samsung',
      'technology',
      'gadgets',
      'consumer electronics',
      'premium electronics',
      'authorized reseller',
    ],
    author: 'ElectroShop Inc.',
    viewport: 'width=device-width, initial-scale=1.0',
    themeColor: '#2563eb',
    language: 'en-US',
  },

  openGraph: {
    title: 'ElectroShop - Your Trusted Electronics Destination',
    description:
      'Shop premium electronics from top brands. Expert advice, exceptional service, and the latest technology at competitive prices. Visit our San Francisco flagship store.',
    type: 'website',
    url: BASE_URL,
    image: DEFAULT_OG_IMAGE,
    imageAlt: 'ElectroShop - Premium Electronics Store',
    imageWidth: '1200',
    imageHeight: '630',
    siteName: 'ElectroShop',
    locale: 'en_US',
    localeAlternate: ['es_US', 'zh_CN'],
  },

  twitter: {
    card: 'summary_large_image',
    site: '@electroshop',
    creator: '@electroshop',
    title: 'ElectroShop - Premium Electronics & Latest Technology',
    description:
      'Discover the latest smartphones, laptops, tablets, and electronics. Premium brands, expert advice, exceptional service. San Francisco flagship store.',
    image: DEFAULT_OG_IMAGE,
    imageAlt: 'ElectroShop - Premium Electronics Store',
  },

  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'ElectronicsStore',
    '@id': `${BASE_URL}/#organization`,
    name: 'ElectroShop',
    legalName: 'ElectroShop Inc.',
    description:
      'Premium electronics retailer specializing in smartphones, laptops, tablets, and accessories from top brands. Serving San Francisco since 2010.',
    url: BASE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${BASE_URL}/images/logo.png`,
      width: '250',
      height: '60',
    },
    image: DEFAULT_OG_IMAGE,
    telephone: '+1-415-555-0123',
    email: 'info@electroshop.com',
    foundingDate: '2010',
    priceRange: '$$',
    paymentAccepted: ['Cash', 'Credit Card', 'Debit Card', 'Apple Pay', 'Google Pay'],
    currenciesAccepted: 'USD',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Technology Boulevard, Suite 100',
      addressLocality: 'San Francisco',
      addressRegion: 'CA',
      postalCode: '94105',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 37.7879,
      longitude: -122.4074,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        opens: '09:00',
        closes: '20:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Friday',
        opens: '09:00',
        closes: '21:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '10:00',
        closes: '21:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Sunday',
        opens: '11:00',
        closes: '18:00',
      },
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+1-415-555-0123',
        contactType: 'customer service',
        areaServed: 'US',
        availableLanguage: ['English', 'Spanish', 'Chinese'],
        contactOption: 'TollFree',
      },
      {
        '@type': 'ContactPoint',
        telephone: '+1-415-555-0123',
        contactType: 'sales',
        areaServed: 'US',
        availableLanguage: ['English', 'Spanish', 'Chinese'],
      },
      {
        '@type': 'ContactPoint',
        telephone: '+1-415-555-0123',
        contactType: 'technical support',
        areaServed: 'US',
        availableLanguage: ['English', 'Spanish', 'Chinese'],
        hoursAvailable: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          opens: '00:00',
          closes: '23:59',
        },
      },
    ],
    sameAs: [
      'https://facebook.com/electroshop',
      'https://twitter.com/electroshop',
      'https://instagram.com/electroshop',
      'https://linkedin.com/company/electroshop',
      'https://youtube.com/electroshop',
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '2500',
      bestRating: '5',
      worstRating: '1',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  },

  productStructuredData: {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${BASE_URL}/#products`,
    name: 'Featured Electronics Products',
    description: 'Premium electronics and technology products available at ElectroShop',
    numberOfItems: 0,
    itemListElement: [],
  },

  breadcrumbStructuredData: {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${BASE_URL}/#breadcrumb`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: BASE_URL,
      },
    ],
  },

  canonical: {
    url: BASE_URL,
    useTrailingSlash: false,
    preferredDomain: 'www',
  },

  robots: {
    index: true,
    follow: true,
    noarchive: false,
    nosnippet: false,
    noimageindex: false,
    maxSnippet: -1,
    maxImagePreview: 'large',
    maxVideoPreview: -1,
  },

  alternateLanguages: [
    {
      hreflang: 'en-US',
      href: BASE_URL,
    },
    {
      hreflang: 'es-US',
      href: `${BASE_URL}/es`,
    },
    {
      hreflang: 'zh-CN',
      href: `${BASE_URL}/zh`,
    },
    {
      hreflang: 'x-default',
      href: BASE_URL,
    },
  ],
};

/**
 * Get complete SEO metadata
 * @returns {SEOMetadata} Complete SEO metadata object
 */
export function getSEOMetadata() {
  return JSON.parse(JSON.stringify(seoMetadata));
}

/**
 * Get page metadata
 * @returns {Object} Page-level metadata
 */
export function getPageMetadata() {
  return JSON.parse(JSON.stringify(seoMetadata.page));
}

/**
 * Get Open Graph metadata
 * @returns {OpenGraphData} Open Graph tags
 */
export function getOpenGraphMetadata() {
  return JSON.parse(JSON.stringify(seoMetadata.openGraph));
}

/**
 * Get Twitter Card metadata
 * @returns {TwitterCardData} Twitter Card tags
 */
export function getTwitterCardMetadata() {
  return JSON.parse(JSON.stringify(seoMetadata.twitter));
}

/**
 * Get organization structured data
 * @returns {OrganizationStructuredData} JSON-LD structured data
 */
export function getOrganizationStructuredData() {
  return JSON.parse(JSON.stringify(seoMetadata.structuredData));
}

/**
 * Get product structured data
 * @returns {ProductStructuredData} Product JSON-LD structured data
 */
export function getProductStructuredData() {
  return JSON.parse(JSON.stringify(seoMetadata.productStructuredData));
}

/**
 * Get breadcrumb structured data
 * @returns {Object} Breadcrumb JSON-LD structured data
 */
export function getBreadcrumbStructuredData() {
  return JSON.parse(JSON.stringify(seoMetadata.breadcrumbStructuredData));
}

/**
 * Get canonical URL configuration
 * @returns {Object} Canonical URL settings
 */
export function getCanonicalConfig() {
  return JSON.parse(JSON.stringify(seoMetadata.canonical));
}

/**
 * Get robots meta tag configuration
 * @returns {Object} Robots meta tag settings
 */
export function getRobotsConfig() {
  return JSON.parse(JSON.stringify(seoMetadata.robots));
}

/**
 * Get alternate language links
 * @returns {Array<Object>} Alternate language configurations
 */
export function getAlternateLanguages() {
  return JSON.parse(JSON.stringify(seoMetadata.alternateLanguages));
}

/**
 * Generate meta tags HTML string
 * @param {Object} [options={}] - Options for meta tag generation
 * @param {boolean} [options.includeOG=true] - Include Open Graph tags
 * @param {boolean} [options.includeTwitter=true] - Include Twitter Card tags
 * @returns {string} HTML meta tags string
 */
export function generateMetaTags(options = {}) {
  const { includeOG = true, includeTwitter = true } = options;
  const tags = [];

  // Basic meta tags
  tags.push(`<meta charset="UTF-8">`);
  tags.push(`<meta name="viewport" content="${seoMetadata.page.viewport}">`);
  tags.push(`<meta name="description" content="${seoMetadata.page.description}">`);
  tags.push(`<meta name="keywords" content="${seoMetadata.page.keywords.join(', ')}">`);
  tags.push(`<meta name="author" content="${seoMetadata.page.author}">`);
  tags.push(`<meta name="theme-color" content="${seoMetadata.page.themeColor}">`);

  // Robots meta tag
  const robotsContent = Object.entries(seoMetadata.robots)
    .filter(([_key, value]) => value === true)
    .map(([key]) => key)
    .join(', ');
  if (robotsContent) {
    tags.push(`<meta name="robots" content="${robotsContent}">`);
  }

  // Open Graph tags
  if (includeOG) {
    tags.push(`<meta property="og:title" content="${seoMetadata.openGraph.title}">`);
    tags.push(`<meta property="og:description" content="${seoMetadata.openGraph.description}">`);
    tags.push(`<meta property="og:type" content="${seoMetadata.openGraph.type}">`);
    tags.push(`<meta property="og:url" content="${seoMetadata.openGraph.url}">`);
    tags.push(`<meta property="og:image" content="${seoMetadata.openGraph.image}">`);
    tags.push(`<meta property="og:image:alt" content="${seoMetadata.openGraph.imageAlt}">`);
    tags.push(`<meta property="og:image:width" content="${seoMetadata.openGraph.imageWidth}">`);
    tags.push(`<meta property="og:image:height" content="${seoMetadata.openGraph.imageHeight}">`);
    tags.push(`<meta property="og:site_name" content="${seoMetadata.openGraph.siteName}">`);
    tags.push(`<meta property="og:locale" content="${seoMetadata.openGraph.locale}">`);
  }

  // Twitter Card tags
  if (includeTwitter) {
    tags.push(`<meta name="twitter:card" content="${seoMetadata.twitter.card}">`);
    tags.push(`<meta name="twitter:site" content="${seoMetadata.twitter.site}">`);
    tags.push(`<meta name="twitter:creator" content="${seoMetadata.twitter.creator}">`);
    tags.push(`<meta name="twitter:title" content="${seoMetadata.twitter.title}">`);
    tags.push(`<meta name="twitter:description" content="${seoMetadata.twitter.description}">`);
    tags.push(`<meta name="twitter:image" content="${seoMetadata.twitter.image}">`);
    tags.push(`<meta name="twitter:image:alt" content="${seoMetadata.twitter.imageAlt}">`);
  }

  return tags.join('\n');
}

/**
 * Generate canonical link tag
 * @param {string} [path=''] - Path to append to base URL
 * @returns {string} Canonical link HTML tag
 */
export function generateCanonicalTag(path = '') {
  const url = path ? `${BASE_URL}${path}` : seoMetadata.canonical.url;
  return `<link rel="canonical" href="${url}">`;
}

/**
 * Generate alternate language link tags
 * @returns {string} Alternate language link tags HTML
 */
export function generateAlternateLanguageTags() {
  return seoMetadata.alternateLanguages
    .map((lang) => `<link rel="alternate" hreflang="${lang.hreflang}" href="${lang.href}">`)
    .join('\n');
}

/**
 * Generate JSON-LD script tag for structured data
 * @param {Object} structuredData - Structured data object
 * @returns {string} JSON-LD script tag HTML
 */
export function generateStructuredDataScript(structuredData) {
  const jsonString = JSON.stringify(structuredData, null, 2);
  return `<script type="application/ld+json">\n${jsonString}\n</script>`;
}

/**
 * Generate all structured data scripts
 * @returns {string} All JSON-LD script tags HTML
 */
export function generateAllStructuredDataScripts() {
  const scripts = [];

  scripts.push(generateStructuredDataScript(seoMetadata.structuredData));
  scripts.push(generateStructuredDataScript(seoMetadata.breadcrumbStructuredData));

  if (seoMetadata.productStructuredData.itemListElement.length > 0) {
    scripts.push(generateStructuredDataScript(seoMetadata.productStructuredData));
  }

  return scripts.join('\n');
}

/**
 * Update product structured data with product items
 * @param {Array<Object>} products - Array of product objects
 * @returns {void}
 */
export function updateProductStructuredData(products) {
  if (!Array.isArray(products) || products.length === 0) {
    return;
  }

  seoMetadata.productStructuredData.numberOfItems = products.length;
  seoMetadata.productStructuredData.itemListElement = products.map((product, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      '@type': 'Product',
      '@id': `${BASE_URL}/products/${product.id}`,
      name: product.name,
      description: product.description,
      image: product.image,
      brand: {
        '@type': 'Brand',
        name: product.brand,
      },
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: 'USD',
        availability: product.inStock
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        url: `${BASE_URL}/products/${product.id}`,
      },
    },
  }));
}

/**
 * Validate SEO metadata completeness
 * @returns {Object} Validation result with errors and warnings
 */
export function validateSEOMetadata() {
  const errors = [];
  const warnings = [];

  // Validate page metadata
  if (!seoMetadata.page.title || seoMetadata.page.title.length < 30) {
    warnings.push('Page title should be at least 30 characters');
  }
  if (seoMetadata.page.title.length > 60) {
    warnings.push('Page title should not exceed 60 characters');
  }

  if (!seoMetadata.page.description || seoMetadata.page.description.length < 120) {
    warnings.push('Meta description should be at least 120 characters');
  }
  if (seoMetadata.page.description.length > 160) {
    warnings.push('Meta description should not exceed 160 characters');
  }

  // Validate Open Graph
  if (!seoMetadata.openGraph.image) {
    errors.push('Open Graph image is required');
  }
  if (!seoMetadata.openGraph.url) {
    errors.push('Open Graph URL is required');
  }

  // Validate structured data
  if (!seoMetadata.structuredData.name) {
    errors.push('Organization name is required in structured data');
  }
  if (!seoMetadata.structuredData.address) {
    errors.push('Organization address is required in structured data');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Export frozen SEO metadata for external use
 * @type {SEOMetadata}
 */
export const frozenSEOMetadata = Object.freeze(JSON.parse(JSON.stringify(seoMetadata)));

/**
 * Default export for convenience
 */
export default {
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
  generateMetaTags,
  generateCanonicalTag,
  generateAlternateLanguageTags,
  generateStructuredDataScript,
  generateAllStructuredDataScripts,
  updateProductStructuredData,
  validateSEOMetadata,
  frozenSEOMetadata,
};