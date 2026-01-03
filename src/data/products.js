/**
 * Product Data Module
 * 
 * Provides structured product data for featured electronics in the hero section.
 * Includes complete product information with specifications, pricing, and optimized
 * image paths for responsive display with WebP/JPEG fallback support.
 * 
 * @module data/products
 * @generated-from task-id:TASK-003 sprint:hero-section
 * @modifies none
 * @dependencies []
 */

/**
 * Product image configuration for responsive display
 * @typedef {Object} ProductImage
 * @property {string} webp - WebP format image path (primary)
 * @property {string} jpeg - JPEG format image path (fallback)
 * @property {string} alt - Descriptive alt text for accessibility
 */

/**
 * Product specification entry
 * @typedef {Object} ProductSpec
 * @property {string} label - Specification label
 * @property {string} value - Specification value
 */

/**
 * Complete product data structure
 * @typedef {Object} Product
 * @property {string} id - Unique product identifier
 * @property {string} name - Product name
 * @property {string} category - Product category
 * @property {number} price - Product price in USD
 * @property {string} currency - Currency code
 * @property {string} description - Product description
 * @property {ProductSpec[]} specifications - Product specifications
 * @property {Object} images - Product images in multiple formats
 * @property {ProductImage} images.hero - Hero section image
 * @property {ProductImage} images.thumbnail - Thumbnail image
 * @property {string} ctaText - Call-to-action button text
 * @property {string} ctaLink - Call-to-action link URL
 * @property {boolean} featured - Featured product flag
 * @property {number} displayOrder - Display order in hero section
 */

/**
 * Featured electronics products for hero section
 * @type {Product[]}
 */
const products = [
  {
    id: 'smartphone-pro-x1',
    name: 'ProPhone X1 Ultra',
    category: 'Smartphones',
    price: 999.99,
    currency: 'USD',
    description:
      'Experience cutting-edge mobile technology with the ProPhone X1 Ultra. Featuring a stunning 6.7-inch OLED display, advanced AI-powered camera system, and lightning-fast 5G connectivity for seamless performance.',
    specifications: [
      { label: 'Display', value: '6.7" OLED, 120Hz' },
      { label: 'Processor', value: 'Octa-core 3.2GHz' },
      { label: 'Camera', value: '108MP Triple Camera' },
      { label: 'Battery', value: '5000mAh Fast Charging' },
      { label: 'Storage', value: '256GB / 512GB' },
      { label: 'RAM', value: '12GB' },
      { label: 'Connectivity', value: '5G, WiFi 6E, Bluetooth 5.3' },
      { label: 'OS', value: 'Latest Mobile OS' },
    ],
    images: {
      hero: {
        webp: '/assets/images/products/smartphone-hero.webp',
        jpeg: '/assets/images/products/smartphone-hero.jpg',
        alt: 'ProPhone X1 Ultra smartphone with stunning OLED display showing vibrant colors',
      },
      thumbnail: {
        webp: '/assets/images/products/smartphone-thumb.webp',
        jpeg: '/assets/images/products/smartphone-thumb.jpg',
        alt: 'ProPhone X1 Ultra thumbnail',
      },
    },
    ctaText: 'Explore ProPhone X1',
    ctaLink: '/products/smartphone-pro-x1',
    featured: true,
    displayOrder: 1,
  },
  {
    id: 'laptop-powerbook-15',
    name: 'PowerBook Pro 15',
    category: 'Laptops',
    price: 1799.99,
    currency: 'USD',
    description:
      'Unleash your productivity with the PowerBook Pro 15. Engineered for professionals and creators, featuring a brilliant 15.6-inch 4K display, powerful multi-core processor, and all-day battery life in a sleek aluminum chassis.',
    specifications: [
      { label: 'Display', value: '15.6" 4K IPS, 100% sRGB' },
      { label: 'Processor', value: 'Intel Core i9 / AMD Ryzen 9' },
      { label: 'Graphics', value: 'Dedicated GPU 8GB VRAM' },
      { label: 'Memory', value: '32GB DDR5 RAM' },
      { label: 'Storage', value: '1TB NVMe SSD' },
      { label: 'Battery', value: 'Up to 12 hours' },
      { label: 'Ports', value: 'Thunderbolt 4, USB-C, HDMI 2.1' },
      { label: 'Weight', value: '3.8 lbs (1.7 kg)' },
    ],
    images: {
      hero: {
        webp: '/assets/images/products/laptop-hero.webp',
        jpeg: '/assets/images/products/laptop-hero.jpg',
        alt: 'PowerBook Pro 15 laptop with 4K display showing professional workspace',
      },
      thumbnail: {
        webp: '/assets/images/products/laptop-thumb.webp',
        jpeg: '/assets/images/products/laptop-thumb.jpg',
        alt: 'PowerBook Pro 15 thumbnail',
      },
    },
    ctaText: 'Discover PowerBook Pro',
    ctaLink: '/products/laptop-powerbook-15',
    featured: true,
    displayOrder: 2,
  },
  {
    id: 'headphones-soundmax-pro',
    name: 'SoundMax Pro Wireless',
    category: 'Audio',
    price: 349.99,
    currency: 'USD',
    description:
      'Immerse yourself in premium audio with SoundMax Pro Wireless headphones. Industry-leading active noise cancellation, studio-quality sound, and luxurious comfort for extended listening sessions.',
    specifications: [
      { label: 'Audio', value: 'Hi-Res Audio, 40mm Drivers' },
      { label: 'Noise Cancellation', value: 'Adaptive ANC' },
      { label: 'Battery Life', value: 'Up to 30 hours' },
      { label: 'Connectivity', value: 'Bluetooth 5.2, Multi-point' },
      { label: 'Charging', value: 'USB-C Fast Charging' },
      { label: 'Weight', value: '250g' },
      { label: 'Features', value: 'Touch Controls, Voice Assistant' },
      { label: 'Compatibility', value: 'Universal Device Support' },
    ],
    images: {
      hero: {
        webp: '/assets/images/products/headphones-hero.webp',
        jpeg: '/assets/images/products/headphones-hero.jpg',
        alt: 'SoundMax Pro Wireless headphones with premium design and cushioned ear cups',
      },
      thumbnail: {
        webp: '/assets/images/products/headphones-thumb.webp',
        jpeg: '/assets/images/products/headphones-thumb.jpg',
        alt: 'SoundMax Pro Wireless thumbnail',
      },
    },
    ctaText: 'Experience SoundMax Pro',
    ctaLink: '/products/headphones-soundmax-pro',
    featured: true,
    displayOrder: 3,
  },
];

/**
 * Get all featured products sorted by display order
 * @returns {Product[]} Array of featured products
 */
export function getFeaturedProducts() {
  return products
    .filter((product) => product.featured)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Get product by ID
 * @param {string} productId - Product identifier
 * @returns {Product|undefined} Product object or undefined if not found
 */
export function getProductById(productId) {
  if (typeof productId !== 'string' || !productId.trim()) {
    return undefined;
  }

  return products.find((product) => product.id === productId);
}

/**
 * Get products by category
 * @param {string} category - Product category
 * @returns {Product[]} Array of products in the specified category
 */
export function getProductsByCategory(category) {
  if (typeof category !== 'string' || !category.trim()) {
    return [];
  }

  return products.filter(
    (product) => product.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Format product price with currency
 * @param {Product} product - Product object
 * @returns {string} Formatted price string
 */
export function formatPrice(product) {
  if (!product || typeof product.price !== 'number') {
    return 'Price unavailable';
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: product.currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(product.price);
}

/**
 * Get responsive image sources for picture element
 * @param {ProductImage} image - Product image object
 * @returns {Object} Image sources with WebP and JPEG formats
 */
export function getImageSources(image) {
  if (!image || !image.webp || !image.jpeg) {
    return {
      webp: '',
      jpeg: '',
      alt: 'Product image',
    };
  }

  return {
    webp: image.webp,
    jpeg: image.jpeg,
    alt: image.alt || 'Product image',
  };
}

/**
 * Validate product data structure
 * @param {Product} product - Product object to validate
 * @returns {boolean} True if product is valid
 */
export function isValidProduct(product) {
  if (!product || typeof product !== 'object') {
    return false;
  }

  const requiredFields = [
    'id',
    'name',
    'category',
    'price',
    'description',
    'images',
    'ctaText',
    'ctaLink',
  ];

  const hasRequiredFields = requiredFields.every(
    (field) => field in product && product[field] !== null
  );

  if (!hasRequiredFields) {
    return false;
  }

  const hasValidImages =
    product.images &&
    product.images.hero &&
    typeof product.images.hero.webp === 'string' &&
    typeof product.images.hero.jpeg === 'string';

  const hasValidPrice =
    typeof product.price === 'number' && product.price >= 0;

  return hasValidImages && hasValidPrice;
}

/**
 * Export all products for external use
 * @type {Product[]}
 */
export const allProducts = Object.freeze([...products]);

/**
 * Default export for convenience
 */
export default {
  getFeaturedProducts,
  getProductById,
  getProductsByCategory,
  formatPrice,
  getImageSources,
  isValidProduct,
  allProducts,
};