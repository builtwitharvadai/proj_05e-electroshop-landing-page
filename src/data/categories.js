/**
 * Categories Data Module
 * 
 * Provides structured category data for electronics product categories section.
 * Includes complete category information with titles, descriptions, image paths,
 * and navigation links for responsive grid display with optimized image loading.
 * 
 * @module data/categories
 * @generated-from task-id:TASK-004 sprint:categories-section
 * @modifies none
 * @dependencies []
 */

/**
 * Category image configuration for responsive display
 * @typedef {Object} CategoryImage
 * @property {string} webp - WebP format image path (primary)
 * @property {string} jpeg - JPEG format image path (fallback)
 * @property {string} alt - Descriptive alt text for accessibility
 */

/**
 * Complete category data structure
 * @typedef {Object} Category
 * @property {string} id - Unique category identifier
 * @property {string} name - Category display name
 * @property {string} description - Category description
 * @property {CategoryImage} image - Category image in multiple formats
 * @property {string} link - Navigation link to category page
 * @property {number} displayOrder - Display order in grid
 * @property {string} icon - Icon identifier for category
 * @property {number} productCount - Estimated product count
 */

/**
 * Electronics product categories
 * @type {Category[]}
 */
const categories = [
  {
    id: 'smartphones',
    name: 'Smartphones',
    description:
      'Discover the latest smartphones with cutting-edge technology, stunning displays, and powerful cameras. From flagship models to budget-friendly options.',
    image: {
      webp: '/assets/images/categories/smartphones.webp',
      jpeg: '/assets/images/categories/smartphones.jpg',
      alt: 'Modern smartphones showcasing latest mobile technology and design',
    },
    link: '/categories/smartphones',
    displayOrder: 1,
    icon: 'smartphone',
    productCount: 150,
  },
  {
    id: 'laptops',
    name: 'Laptops',
    description:
      'Explore high-performance laptops for work, gaming, and creativity. Featuring powerful processors, stunning displays, and portable designs for every need.',
    image: {
      webp: '/assets/images/categories/laptops.webp',
      jpeg: '/assets/images/categories/laptops.jpg',
      alt: 'Professional laptops with high-performance specifications and sleek designs',
    },
    link: '/categories/laptops',
    displayOrder: 2,
    icon: 'laptop',
    productCount: 120,
  },
  {
    id: 'tablets',
    name: 'Tablets',
    description:
      'Find the perfect tablet for entertainment, productivity, and creativity. Lightweight, versatile devices with vibrant displays and long battery life.',
    image: {
      webp: '/assets/images/categories/tablets.webp',
      jpeg: '/assets/images/categories/tablets.jpg',
      alt: 'Versatile tablets for entertainment and productivity with touchscreen displays',
    },
    link: '/categories/tablets',
    displayOrder: 3,
    icon: 'tablet',
    productCount: 80,
  },
  {
    id: 'accessories',
    name: 'Accessories',
    description:
      'Enhance your devices with premium accessories. Cases, chargers, cables, screen protectors, and more to protect and optimize your electronics.',
    image: {
      webp: '/assets/images/categories/accessories.webp',
      jpeg: '/assets/images/categories/accessories.jpg',
      alt: 'Essential electronics accessories including cases, chargers, and cables',
    },
    link: '/categories/accessories',
    displayOrder: 4,
    icon: 'accessories',
    productCount: 300,
  },
  {
    id: 'audio',
    name: 'Audio Equipment',
    description:
      'Immerse yourself in premium sound with headphones, earbuds, speakers, and soundbars. Experience studio-quality audio and noise cancellation.',
    image: {
      webp: '/assets/images/categories/audio.webp',
      jpeg: '/assets/images/categories/audio.jpg',
      alt: 'Premium audio equipment including headphones, speakers, and earbuds',
    },
    link: '/categories/audio',
    displayOrder: 5,
    icon: 'audio',
    productCount: 200,
  },
  {
    id: 'home-electronics',
    name: 'Home Electronics',
    description:
      'Transform your living space with smart home devices, TVs, streaming devices, and home automation. Create a connected, intelligent home environment.',
    image: {
      webp: '/assets/images/categories/home-electronics.webp',
      jpeg: '/assets/images/categories/home-electronics.jpg',
      alt: 'Smart home electronics and entertainment devices for modern living',
    },
    link: '/categories/home-electronics',
    displayOrder: 6,
    icon: 'home',
    productCount: 180,
  },
];

/**
 * Get all categories sorted by display order
 * @returns {Category[]} Array of categories
 */
export function getAllCategories() {
  return categories
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Get category by ID
 * @param {string} categoryId - Category identifier
 * @returns {Category|undefined} Category object or undefined if not found
 */
export function getCategoryById(categoryId) {
  if (typeof categoryId !== 'string' || !categoryId.trim()) {
    return undefined;
  }

  return categories.find((category) => category.id === categoryId);
}

/**
 * Get category by name (case-insensitive)
 * @param {string} categoryName - Category name
 * @returns {Category|undefined} Category object or undefined if not found
 */
export function getCategoryByName(categoryName) {
  if (typeof categoryName !== 'string' || !categoryName.trim()) {
    return undefined;
  }

  return categories.find(
    (category) =>
      category.name.toLowerCase() === categoryName.toLowerCase()
  );
}

/**
 * Get responsive image sources for picture element
 * @param {CategoryImage} image - Category image object
 * @returns {Object} Image sources with WebP and JPEG formats
 */
export function getImageSources(image) {
  if (!image || !image.webp || !image.jpeg) {
    return {
      webp: '',
      jpeg: '',
      alt: 'Category image',
    };
  }

  return {
    webp: image.webp,
    jpeg: image.jpeg,
    alt: image.alt || 'Category image',
  };
}

/**
 * Validate category data structure
 * @param {Category} category - Category object to validate
 * @returns {boolean} True if category is valid
 */
export function isValidCategory(category) {
  if (!category || typeof category !== 'object') {
    return false;
  }

  const requiredFields = [
    'id',
    'name',
    'description',
    'image',
    'link',
    'displayOrder',
  ];

  const hasRequiredFields = requiredFields.every(
    (field) => field in category && category[field] !== null
  );

  if (!hasRequiredFields) {
    return false;
  }

  const hasValidImage =
    category.image &&
    typeof category.image.webp === 'string' &&
    typeof category.image.jpeg === 'string' &&
    typeof category.image.alt === 'string';

  const hasValidDisplayOrder =
    typeof category.displayOrder === 'number' &&
    category.displayOrder > 0;

  const hasValidLink =
    typeof category.link === 'string' &&
    category.link.startsWith('/');

  return hasValidImage && hasValidDisplayOrder && hasValidLink;
}

/**
 * Get categories count
 * @returns {number} Total number of categories
 */
export function getCategoriesCount() {
  return categories.length;
}

/**
 * Get total product count across all categories
 * @returns {number} Total product count
 */
export function getTotalProductCount() {
  return categories.reduce(
    (total, category) => total + (category.productCount || 0),
    0
  );
}

/**
 * Search categories by keyword
 * @param {string} keyword - Search keyword
 * @returns {Category[]} Array of matching categories
 */
export function searchCategories(keyword) {
  if (typeof keyword !== 'string' || !keyword.trim()) {
    return [];
  }

  const searchTerm = keyword.toLowerCase().trim();

  return categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm) ||
      category.description.toLowerCase().includes(searchTerm)
  );
}

/**
 * Get category navigation data for breadcrumbs
 * @param {string} categoryId - Category identifier
 * @returns {Object} Navigation data with category info
 */
export function getCategoryNavigation(categoryId) {
  const category = getCategoryById(categoryId);

  if (!category) {
    return {
      found: false,
      breadcrumbs: [],
    };
  }

  return {
    found: true,
    breadcrumbs: [
      { name: 'Home', link: '/' },
      { name: 'Categories', link: '/categories' },
      { name: category.name, link: category.link },
    ],
    category,
  };
}

/**
 * Export all categories for external use
 * @type {Category[]}
 */
export const allCategories = Object.freeze([...categories]);

/**
 * Default export for convenience
 */
export default {
  getAllCategories,
  getCategoryById,
  getCategoryByName,
  getImageSources,
  isValidCategory,
  getCategoriesCount,
  getTotalProductCount,
  searchCategories,
  getCategoryNavigation,
  allCategories,
};