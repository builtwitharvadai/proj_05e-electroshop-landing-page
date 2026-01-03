/**
 * Store Information Data Module
 * 
 * Provides comprehensive store information including location details, business hours,
 * contact methods, company overview, and map coordinates for the store information section.
 * Includes validation utilities and data access functions for store-related information.
 * 
 * @module data/store-info
 * @generated-from task-id:TASK-005 sprint:store-info-section
 * @modifies none
 * @dependencies []
 */

/**
 * Business hours for a specific day
 * @typedef {Object} DayHours
 * @property {string} day - Day of the week
 * @property {string} open - Opening time (24-hour format)
 * @property {string} close - Closing time (24-hour format)
 * @property {boolean} closed - Whether the store is closed this day
 */

/**
 * Geographic coordinates for map integration
 * @typedef {Object} Coordinates
 * @property {number} latitude - Latitude coordinate
 * @property {number} longitude - Longitude coordinate
 */

/**
 * Social media link configuration
 * @typedef {Object} SocialLink
 * @property {string} platform - Social media platform name
 * @property {string} url - Profile URL
 * @property {string} icon - Icon identifier
 * @property {string} label - Accessible label
 */

/**
 * Trust indicator for company credibility
 * @typedef {Object} TrustIndicator
 * @property {string} type - Indicator type (certification, award, rating, etc.)
 * @property {string} title - Indicator title
 * @property {string} description - Indicator description
 * @property {string} icon - Icon identifier
 * @property {string|null} verificationUrl - URL for verification (if applicable)
 */

/**
 * Complete store information structure
 * @typedef {Object} StoreInfo
 * @property {Object} location - Physical location details
 * @property {Object} contact - Contact information
 * @property {DayHours[]} businessHours - Weekly business hours
 * @property {Object} company - Company overview
 * @property {Coordinates} mapCoordinates - Geographic coordinates
 * @property {SocialLink[]} socialMedia - Social media links
 * @property {TrustIndicator[]} trustIndicators - Trust and credibility indicators
 */

/**
 * Store information data
 * @type {StoreInfo}
 */
const storeInfo = {
  location: {
    name: 'ElectroShop Flagship Store',
    address: {
      street: '123 Technology Boulevard',
      suite: 'Suite 100',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'United States',
    },
    formattedAddress: '123 Technology Boulevard, Suite 100, San Francisco, CA 94105',
    landmark: 'Near Union Square, across from Tech Plaza',
    parkingInfo: 'Free parking available in adjacent garage',
    publicTransit: 'BART: Montgomery Station (2 blocks), MUNI: Lines 5, 6, 7',
  },

  contact: {
    phone: {
      main: '+1 (415) 555-0123',
      tollfree: '+1 (800) 555-0123',
      formatted: '(415) 555-0123',
      international: '+1-415-555-0123',
    },
    email: {
      general: 'info@electroshop.com',
      support: 'support@electroshop.com',
      sales: 'sales@electroshop.com',
      corporate: 'corporate@electroshop.com',
    },
    fax: '+1 (415) 555-0124',
    website: 'https://www.electroshop.com',
  },

  businessHours: [
    {
      day: 'Monday',
      dayShort: 'Mon',
      open: '09:00',
      close: '20:00',
      closed: false,
      displayTime: '9:00 AM - 8:00 PM',
    },
    {
      day: 'Tuesday',
      dayShort: 'Tue',
      open: '09:00',
      close: '20:00',
      closed: false,
      displayTime: '9:00 AM - 8:00 PM',
    },
    {
      day: 'Wednesday',
      dayShort: 'Wed',
      open: '09:00',
      close: '20:00',
      closed: false,
      displayTime: '9:00 AM - 8:00 PM',
    },
    {
      day: 'Thursday',
      dayShort: 'Thu',
      open: '09:00',
      close: '20:00',
      closed: false,
      displayTime: '9:00 AM - 8:00 PM',
    },
    {
      day: 'Friday',
      dayShort: 'Fri',
      open: '09:00',
      close: '21:00',
      closed: false,
      displayTime: '9:00 AM - 9:00 PM',
    },
    {
      day: 'Saturday',
      dayShort: 'Sat',
      open: '10:00',
      close: '21:00',
      closed: false,
      displayTime: '10:00 AM - 9:00 PM',
    },
    {
      day: 'Sunday',
      dayShort: 'Sun',
      open: '11:00',
      close: '18:00',
      closed: false,
      displayTime: '11:00 AM - 6:00 PM',
    },
  ],

  company: {
    name: 'ElectroShop',
    legalName: 'ElectroShop Inc.',
    tagline: 'Your Trusted Electronics Destination',
    description:
      'ElectroShop has been serving the San Francisco Bay Area since 2010, providing premium electronics, expert advice, and exceptional customer service. We specialize in the latest smartphones, laptops, tablets, and accessories from top brands worldwide.',
    mission:
      'To empower our customers with cutting-edge technology and personalized service, making electronics accessible and enjoyable for everyone.',
    founded: '2010',
    employees: '50-100',
    certifications: [
      'Authorized Apple Reseller',
      'Samsung Premium Partner',
      'Microsoft Certified Partner',
    ],
    awards: [
      'Best Electronics Retailer 2023 - SF Business Journal',
      'Customer Service Excellence Award 2022',
      'Top Rated Local Business 2021-2023',
    ],
  },

  mapCoordinates: {
    latitude: 37.7879,
    longitude: -122.4074,
    zoom: 15,
    mapType: 'roadmap',
  },

  socialMedia: [
    {
      platform: 'Facebook',
      url: 'https://facebook.com/electroshop',
      icon: 'facebook',
      label: 'Follow us on Facebook',
      handle: '@electroshop',
    },
    {
      platform: 'Twitter',
      url: 'https://twitter.com/electroshop',
      icon: 'twitter',
      label: 'Follow us on Twitter',
      handle: '@electroshop',
    },
    {
      platform: 'Instagram',
      url: 'https://instagram.com/electroshop',
      icon: 'instagram',
      label: 'Follow us on Instagram',
      handle: '@electroshop',
    },
    {
      platform: 'LinkedIn',
      url: 'https://linkedin.com/company/electroshop',
      icon: 'linkedin',
      label: 'Connect with us on LinkedIn',
      handle: 'ElectroShop Inc.',
    },
    {
      platform: 'YouTube',
      url: 'https://youtube.com/electroshop',
      icon: 'youtube',
      label: 'Subscribe to our YouTube channel',
      handle: '@electroshop',
    },
  ],

  trustIndicators: [
    {
      type: 'certification',
      title: 'BBB Accredited',
      description: 'A+ Rating with Better Business Bureau',
      icon: 'shield-check',
      verificationUrl: 'https://www.bbb.org/us/ca/san-francisco/profile/electroshop',
    },
    {
      type: 'rating',
      title: '4.8/5 Stars',
      description: 'Based on 2,500+ customer reviews',
      icon: 'star',
      verificationUrl: null,
    },
    {
      type: 'warranty',
      title: 'Extended Warranty',
      description: 'Free 2-year warranty on all products',
      icon: 'shield',
      verificationUrl: null,
    },
    {
      type: 'security',
      title: 'Secure Payments',
      description: 'PCI DSS compliant payment processing',
      icon: 'lock',
      verificationUrl: null,
    },
    {
      type: 'support',
      title: '24/7 Support',
      description: 'Round-the-clock customer assistance',
      icon: 'headset',
      verificationUrl: null,
    },
    {
      type: 'shipping',
      title: 'Free Shipping',
      description: 'On orders over $50 within the US',
      icon: 'truck',
      verificationUrl: null,
    },
  ],
};

/**
 * Get complete store information
 * @returns {StoreInfo} Complete store information object
 */
export function getStoreInfo() {
  return JSON.parse(JSON.stringify(storeInfo));
}

/**
 * Get store location details
 * @returns {Object} Location information
 */
export function getLocationInfo() {
  return JSON.parse(JSON.stringify(storeInfo.location));
}

/**
 * Get store contact information
 * @returns {Object} Contact details
 */
export function getContactInfo() {
  return JSON.parse(JSON.stringify(storeInfo.contact));
}

/**
 * Get business hours for all days
 * @returns {DayHours[]} Array of business hours
 */
export function getBusinessHours() {
  return JSON.parse(JSON.stringify(storeInfo.businessHours));
}

/**
 * Get business hours for specific day
 * @param {string} day - Day of the week (full name or short form)
 * @returns {DayHours|undefined} Business hours for the day or undefined
 */
export function getBusinessHoursForDay(day) {
  if (typeof day !== 'string' || !day.trim()) {
    return undefined;
  }

  const normalizedDay = day.trim().toLowerCase();

  return storeInfo.businessHours.find(
    (hours) =>
      hours.day.toLowerCase() === normalizedDay ||
      hours.dayShort.toLowerCase() === normalizedDay
  );
}

/**
 * Check if store is currently open
 * @param {Date} [currentTime=new Date()] - Current time to check against
 * @returns {Object} Store status with open/closed state and next change time
 */
export function isStoreOpen(currentTime = new Date()) {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const currentDay = days[currentTime.getDay()];
  const currentHours = getBusinessHoursForDay(currentDay);

  if (!currentHours || currentHours.closed) {
    return {
      isOpen: false,
      status: 'closed',
      message: 'Store is closed today',
      nextOpen: getNextOpenTime(currentTime),
    };
  }

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const [openHour, openMinute] = currentHours.open.split(':').map(Number);
  const [closeHour, closeMinute] = currentHours.close.split(':').map(Number);
  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;

  if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
    return {
      isOpen: true,
      status: 'open',
      message: `Open until ${currentHours.displayTime.split(' - ')[1]}`,
      closesAt: currentHours.close,
    };
  }

  if (currentMinutes < openMinutes) {
    return {
      isOpen: false,
      status: 'closed',
      message: `Opens at ${currentHours.displayTime.split(' - ')[0]}`,
      opensAt: currentHours.open,
    };
  }

  return {
    isOpen: false,
    status: 'closed',
    message: 'Store is closed',
    nextOpen: getNextOpenTime(currentTime),
  };
}

/**
 * Get next opening time from current time
 * @param {Date} currentTime - Current time
 * @returns {string} Next opening time description
 */
function getNextOpenTime(currentTime) {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  let checkDate = new Date(currentTime);
  checkDate.setDate(checkDate.getDate() + 1);

  for (let i = 0; i < 7; i++) {
    const dayName = days[checkDate.getDay()];
    const hours = getBusinessHoursForDay(dayName);

    if (hours && !hours.closed) {
      return `${dayName} at ${hours.displayTime.split(' - ')[0]}`;
    }

    checkDate.setDate(checkDate.getDate() + 1);
  }

  return 'Check back later';
}

/**
 * Get company information
 * @returns {Object} Company details
 */
export function getCompanyInfo() {
  return JSON.parse(JSON.stringify(storeInfo.company));
}

/**
 * Get map coordinates for embedding
 * @returns {Coordinates} Geographic coordinates
 */
export function getMapCoordinates() {
  return JSON.parse(JSON.stringify(storeInfo.mapCoordinates));
}

/**
 * Get Google Maps embed URL
 * @param {number} [width=600] - Map width
 * @param {number} [height=450] - Map height
 * @returns {string} Google Maps embed URL
 */
export function getGoogleMapsEmbedUrl(width = 600, height = 450) {
  const { latitude, longitude, zoom } = storeInfo.mapCoordinates;
  const address = encodeURIComponent(storeInfo.location.formattedAddress);

  return `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${address}&center=${latitude},${longitude}&zoom=${zoom}&maptype=roadmap`;
}

/**
 * Get Google Maps link URL for opening in new tab
 * @returns {string} Google Maps link URL
 */
export function getGoogleMapsLink() {
  const { latitude, longitude } = storeInfo.mapCoordinates;
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

/**
 * Get social media links
 * @returns {SocialLink[]} Array of social media links
 */
export function getSocialMediaLinks() {
  return JSON.parse(JSON.stringify(storeInfo.socialMedia));
}

/**
 * Get social media link by platform
 * @param {string} platform - Platform name
 * @returns {SocialLink|undefined} Social media link or undefined
 */
export function getSocialMediaLink(platform) {
  if (typeof platform !== 'string' || !platform.trim()) {
    return undefined;
  }

  return storeInfo.socialMedia.find(
    (link) => link.platform.toLowerCase() === platform.toLowerCase()
  );
}

/**
 * Get trust indicators
 * @returns {TrustIndicator[]} Array of trust indicators
 */
export function getTrustIndicators() {
  return JSON.parse(JSON.stringify(storeInfo.trustIndicators));
}

/**
 * Get trust indicators by type
 * @param {string} type - Indicator type
 * @returns {TrustIndicator[]} Array of matching trust indicators
 */
export function getTrustIndicatorsByType(type) {
  if (typeof type !== 'string' || !type.trim()) {
    return [];
  }

  return storeInfo.trustIndicators.filter(
    (indicator) => indicator.type.toLowerCase() === type.toLowerCase()
  );
}

/**
 * Format phone number for display
 * @param {string} phoneNumber - Phone number to format
 * @param {string} [format='formatted'] - Format type (formatted, international, tel)
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(phoneNumber, format = 'formatted') {
  if (typeof phoneNumber !== 'string' || !phoneNumber.trim()) {
    return '';
  }

  const digits = phoneNumber.replace(/\D/g, '');

  if (format === 'tel') {
    return `tel:+${digits}`;
  }

  if (format === 'international') {
    return `+${digits.slice(0, 1)}-${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return phoneNumber;
}

/**
 * Validate email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email is valid
 */
export function isValidEmail(email) {
  if (typeof email !== 'string' || !email.trim()) {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if phone is valid
 */
export function isValidPhone(phone) {
  if (typeof phone !== 'string' || !phone.trim()) {
    return false;
  }

  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Get formatted address for display
 * @param {boolean} [includeCountry=false] - Include country in address
 * @returns {string} Formatted address string
 */
export function getFormattedAddress(includeCountry = false) {
  const { address } = storeInfo.location;
  const parts = [
    address.street,
    address.suite,
    `${address.city}, ${address.state} ${address.zipCode}`,
  ];

  if (includeCountry) {
    parts.push(address.country);
  }

  return parts.filter(Boolean).join(', ');
}

/**
 * Get store information for structured data (Schema.org)
 * @returns {Object} Structured data object
 */
export function getStructuredData() {
  const { location, contact, businessHours, company, mapCoordinates } =
    storeInfo;

  return {
    '@context': 'https://schema.org',
    '@type': 'ElectronicsStore',
    name: company.name,
    description: company.description,
    url: contact.website,
    telephone: contact.phone.main,
    email: contact.email.general,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${location.address.street}, ${location.address.suite}`,
      addressLocality: location.address.city,
      addressRegion: location.address.state,
      postalCode: location.address.zipCode,
      addressCountry: location.address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: mapCoordinates.latitude,
      longitude: mapCoordinates.longitude,
    },
    openingHoursSpecification: businessHours
      .filter((hours) => !hours.closed)
      .map((hours) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: hours.day,
        opens: hours.open,
        closes: hours.close,
      })),
    sameAs: storeInfo.socialMedia.map((link) => link.url),
  };
}

/**
 * Export frozen store info for external use
 * @type {StoreInfo}
 */
export const frozenStoreInfo = Object.freeze(
  JSON.parse(JSON.stringify(storeInfo))
);

/**
 * Default export for convenience
 */
export default {
  getStoreInfo,
  getLocationInfo,
  getContactInfo,
  getBusinessHours,
  getBusinessHoursForDay,
  isStoreOpen,
  getCompanyInfo,
  getMapCoordinates,
  getGoogleMapsEmbedUrl,
  getGoogleMapsLink,
  getSocialMediaLinks,
  getSocialMediaLink,
  getTrustIndicators,
  getTrustIndicatorsByType,
  formatPhoneNumber,
  isValidEmail,
  isValidPhone,
  getFormattedAddress,
  getStructuredData,
  frozenStoreInfo,
};