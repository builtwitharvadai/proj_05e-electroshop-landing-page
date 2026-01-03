/**
 * Store Information Module
 * 
 * Handles store information functionality including business hours display with open/closed status,
 * store data rendering, map iframe setup, click tracking for contact methods, and timezone handling.
 * Provides comprehensive DOM manipulation, event handling, and real-time status updates.
 * 
 * @module scripts/store-info
 * @generated-from task-id:TASK-005 sprint:store-info-section
 * @modifies DOM elements in store information section
 * @dependencies [src/data/store-info.js]
 */

import {
  getStoreInfo,
  getBusinessHours,
  isStoreOpen,
  getGoogleMapsEmbedUrl,
  getGoogleMapsLink,
  formatPhoneNumber,
  isValidEmail,
  isValidPhone,
} from '../data/store-info.js';

/**
 * Store information state management
 * @type {Object}
 */
const state = {
  initialized: false,
  statusUpdateInterval: null,
  mapLoaded: false,
  contactMethodClicks: new Map(),
  lastStatusCheck: null,
};

/**
 * Configuration constants
 * @type {Object}
 */
const CONFIG = Object.freeze({
  STATUS_UPDATE_INTERVAL: 60000, // 1 minute
  MAP_WIDTH: 600,
  MAP_HEIGHT: 450,
  TIMEZONE: 'America/Los_Angeles', // PST/PDT for San Francisco
  ANALYTICS_ENABLED: true,
  FEATURE_FLAG: 'store_info_enabled',
});

/**
 * Initialize store information functionality
 * Orchestrates all store info features including status display, map setup, and event handlers
 * @returns {void}
 */
export function initStoreInfo() {
  try {
    if (state.initialized) {
      console.warn('[StoreInfo] Already initialized, skipping');
      return;
    }

    console.log('[StoreInfo] Initializing store information module');

    // Check feature flag
    if (!isFeatureEnabled()) {
      console.log('[StoreInfo] Feature disabled via feature flag');
      return;
    }

    // Render store information
    renderStoreInformation();

    // Setup business hours with status
    setupBusinessHours();

    // Initialize map
    initializeMap();

    // Setup contact method tracking
    setupContactTracking();

    // Start status update interval
    startStatusUpdates();

    state.initialized = true;
    console.log('[StoreInfo] Initialization complete');
  } catch (error) {
    console.error('[StoreInfo] Initialization failed:', error);
    handleInitializationError(error);
  }
}

/**
 * Check if store info feature is enabled
 * @returns {boolean} True if feature is enabled
 */
function isFeatureEnabled() {
  try {
    const featureFlags = window.featureFlags || {};
    return featureFlags[CONFIG.FEATURE_FLAG] !== false;
  } catch (error) {
    console.warn('[StoreInfo] Feature flag check failed, defaulting to enabled:', error);
    return true;
  }
}

/**
 * Render complete store information to DOM
 * @returns {void}
 */
function renderStoreInformation() {
  try {
    const storeInfo = getStoreInfo();
    
    // Render location information
    renderLocationInfo(storeInfo.location);

    // Render contact information
    renderContactInfo(storeInfo.contact);

    // Render company overview
    renderCompanyOverview(storeInfo.company);

    // Render trust indicators
    renderTrustIndicators(storeInfo.trustIndicators);

    console.log('[StoreInfo] Store information rendered successfully');
  } catch (error) {
    console.error('[StoreInfo] Failed to render store information:', error);
    throw new Error('Store information rendering failed', { cause: error });
  }
}

/**
 * Render location information
 * @param {Object} location - Location data
 * @returns {void}
 */
function renderLocationInfo(location) {
  const locationElement = document.querySelector('[data-store-location]');
  if (!locationElement) {
    console.warn('[StoreInfo] Location element not found');
    return;
  }

  const { address, landmark, parkingInfo, publicTransit } = location;

  locationElement.innerHTML = `
    <div class="location-details">
      <h3 class="location-name">${escapeHtml(location.name)}</h3>
      <address class="location-address">
        <p>${escapeHtml(address.street)}</p>
        ${address.suite ? `<p>${escapeHtml(address.suite)}</p>` : ''}
        <p>${escapeHtml(address.city)}, ${escapeHtml(address.state)} ${escapeHtml(address.zipCode)}</p>
        <p>${escapeHtml(address.country)}</p>
      </address>
      ${landmark ? `<p class="location-landmark"><strong>Landmark:</strong> ${escapeHtml(landmark)}</p>` : ''}
      ${parkingInfo ? `<p class="location-parking"><strong>Parking:</strong> ${escapeHtml(parkingInfo)}</p>` : ''}
      ${publicTransit ? `<p class="location-transit"><strong>Public Transit:</strong> ${escapeHtml(publicTransit)}</p>` : ''}
    </div>
  `;
}

/**
 * Render contact information with clickable links
 * @param {Object} contact - Contact data
 * @returns {void}
 */
function renderContactInfo(contact) {
  const contactElement = document.querySelector('[data-store-contact]');
  if (!contactElement) {
    console.warn('[StoreInfo] Contact element not found');
    return;
  }

  const { phone, email } = contact;

  contactElement.innerHTML = `
    <div class="contact-methods">
      <div class="contact-method">
        <h4>Phone</h4>
        <a href="${formatPhoneNumber(phone.main, 'tel')}" 
           class="contact-link" 
           data-contact-type="phone"
           data-contact-value="${escapeHtml(phone.main)}">
          ${escapeHtml(formatPhoneNumber(phone.main, 'formatted'))}
        </a>
        ${phone.tollfree ? `
          <a href="${formatPhoneNumber(phone.tollfree, 'tel')}" 
             class="contact-link contact-link-secondary" 
             data-contact-type="phone-tollfree"
             data-contact-value="${escapeHtml(phone.tollfree)}">
            ${escapeHtml(formatPhoneNumber(phone.tollfree, 'formatted'))} (Toll-free)
          </a>
        ` : ''}
      </div>
      <div class="contact-method">
        <h4>Email</h4>
        <a href="mailto:${escapeHtml(email.general)}" 
           class="contact-link" 
           data-contact-type="email"
           data-contact-value="${escapeHtml(email.general)}">
          ${escapeHtml(email.general)}
        </a>
        ${email.support ? `
          <a href="mailto:${escapeHtml(email.support)}" 
             class="contact-link contact-link-secondary" 
             data-contact-type="email-support"
             data-contact-value="${escapeHtml(email.support)}">
            ${escapeHtml(email.support)} (Support)
          </a>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Render company overview
 * @param {Object} company - Company data
 * @returns {void}
 */
function renderCompanyOverview(company) {
  const overviewElement = document.querySelector('[data-company-overview]');
  if (!overviewElement) {
    console.warn('[StoreInfo] Company overview element not found');
    return;
  }

  overviewElement.innerHTML = `
    <div class="company-info">
      <h3>${escapeHtml(company.name)}</h3>
      <p class="company-tagline">${escapeHtml(company.tagline)}</p>
      <p class="company-description">${escapeHtml(company.description)}</p>
      ${company.mission ? `<p class="company-mission"><strong>Our Mission:</strong> ${escapeHtml(company.mission)}</p>` : ''}
      ${company.founded ? `<p class="company-founded"><strong>Founded:</strong> ${escapeHtml(company.founded)}</p>` : ''}
    </div>
  `;
}

/**
 * Render trust indicators
 * @param {Array} indicators - Trust indicators array
 * @returns {void}
 */
function renderTrustIndicators(indicators) {
  const indicatorsElement = document.querySelector('[data-trust-indicators]');
  if (!indicatorsElement || !Array.isArray(indicators)) {
    return;
  }

  const indicatorsHtml = indicators
    .map(
      (indicator) => `
    <div class="trust-indicator" data-indicator-type="${escapeHtml(indicator.type)}">
      <div class="indicator-icon">${escapeHtml(indicator.icon)}</div>
      <h4 class="indicator-title">${escapeHtml(indicator.title)}</h4>
      <p class="indicator-description">${escapeHtml(indicator.description)}</p>
      ${indicator.verificationUrl ? `<a href="${escapeHtml(indicator.verificationUrl)}" target="_blank" rel="noopener noreferrer" class="indicator-verify">Verify</a>` : ''}
    </div>
  `
    )
    .join('');

  indicatorsElement.innerHTML = `<div class="trust-indicators-grid">${indicatorsHtml}</div>`;
}

/**
 * Setup business hours display with real-time status
 * @returns {void}
 */
function setupBusinessHours() {
  try {
    const hoursElement = document.querySelector('[data-business-hours]');
    if (!hoursElement) {
      console.warn('[StoreInfo] Business hours element not found');
      return;
    }

    renderBusinessHours(hoursElement);
    updateStoreStatus();

    console.log('[StoreInfo] Business hours setup complete');
  } catch (error) {
    console.error('[StoreInfo] Failed to setup business hours:', error);
  }
}

/**
 * Render business hours to DOM
 * @param {HTMLElement} container - Container element
 * @returns {void}
 */
function renderBusinessHours(container) {
  const hours = getBusinessHours();
  const currentTime = getCurrentTime();
  const currentDay = getDayName(currentTime);

  const hoursHtml = hours
    .map((dayHours) => {
      const isToday = dayHours.day === currentDay;
      const statusClass = isToday ? 'hours-day-current' : '';

      return `
      <div class="hours-day ${statusClass}" data-day="${escapeHtml(dayHours.day)}">
        <span class="hours-day-name">${escapeHtml(dayHours.day)}</span>
        <span class="hours-day-time">
          ${dayHours.closed ? 'Closed' : escapeHtml(dayHours.displayTime)}
        </span>
      </div>
    `;
    })
    .join('');

  container.innerHTML = `
    <div class="business-hours">
      <div class="hours-status" data-hours-status></div>
      <div class="hours-list">${hoursHtml}</div>
    </div>
  `;
}

/**
 * Update store open/closed status
 * @returns {void}
 */
function updateStoreStatus() {
  try {
    const statusElement = document.querySelector('[data-hours-status]');
    if (!statusElement) {
      return;
    }

    const currentTime = getCurrentTime();
    const status = isStoreOpen(currentTime);
    state.lastStatusCheck = currentTime;

    const statusClass = status.isOpen ? 'status-open' : 'status-closed';
    const statusText = status.isOpen ? 'Open Now' : 'Closed';

    statusElement.innerHTML = `
      <div class="store-status ${statusClass}">
        <span class="status-indicator"></span>
        <span class="status-text">${statusText}</span>
        <span class="status-message">${escapeHtml(status.message)}</span>
      </div>
    `;

    console.log('[StoreInfo] Store status updated:', status.status);
  } catch (error) {
    console.error('[StoreInfo] Failed to update store status:', error);
  }
}

/**
 * Initialize Google Maps integration
 * @returns {void}
 */
function initializeMap() {
  try {
    const mapContainer = document.querySelector('[data-store-map]');
    if (!mapContainer) {
      console.warn('[StoreInfo] Map container not found');
      return;
    }

    const mapUrl = getGoogleMapsEmbedUrl(CONFIG.MAP_WIDTH, CONFIG.MAP_HEIGHT);
    const directionsUrl = getGoogleMapsLink();

    mapContainer.innerHTML = `
      <div class="map-wrapper">
        <iframe
          class="map-iframe"
          width="${CONFIG.MAP_WIDTH}"
          height="${CONFIG.MAP_HEIGHT}"
          frameborder="0"
          style="border:0"
          src="${escapeHtml(mapUrl)}"
          allowfullscreen
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          data-map-iframe
        ></iframe>
        <div class="map-overlay">
          <a href="${escapeHtml(directionsUrl)}" 
             target="_blank" 
             rel="noopener noreferrer"
             class="map-directions-link"
             data-contact-type="map-directions">
            Get Directions
          </a>
        </div>
      </div>
    `;

    setupMapLoadTracking();
    state.mapLoaded = true;

    console.log('[StoreInfo] Map initialized successfully');
  } catch (error) {
    console.error('[StoreInfo] Failed to initialize map:', error);
    renderMapFallback();
  }
}

/**
 * Setup map load tracking
 * @returns {void}
 */
function setupMapLoadTracking() {
  const mapIframe = document.querySelector('[data-map-iframe]');
  if (!mapIframe) {
    return;
  }

  mapIframe.addEventListener('load', () => {
    console.log('[StoreInfo] Map loaded successfully');
    trackEvent('map_loaded', { timestamp: Date.now() });
  });

  mapIframe.addEventListener('error', (error) => {
    console.error('[StoreInfo] Map failed to load:', error);
    trackEvent('map_error', { error: error.message });
  });
}

/**
 * Render map fallback when iframe fails
 * @returns {void}
 */
function renderMapFallback() {
  const mapContainer = document.querySelector('[data-store-map]');
  if (!mapContainer) {
    return;
  }

  const directionsUrl = getGoogleMapsLink();

  mapContainer.innerHTML = `
    <div class="map-fallback">
      <p>Map could not be loaded</p>
      <a href="${escapeHtml(directionsUrl)}" 
         target="_blank" 
         rel="noopener noreferrer"
         class="map-fallback-link">
        Open in Google Maps
      </a>
    </div>
  `;
}

/**
 * Setup contact method click tracking
 * @returns {void}
 */
function setupContactTracking() {
  try {
    const contactLinks = document.querySelectorAll('[data-contact-type]');

    contactLinks.forEach((link) => {
      link.addEventListener('click', handleContactClick);
    });

    console.log('[StoreInfo] Contact tracking setup complete');
  } catch (error) {
    console.error('[StoreInfo] Failed to setup contact tracking:', error);
  }
}

/**
 * Handle contact method click
 * @param {Event} event - Click event
 * @returns {void}
 */
function handleContactClick(event) {
  try {
    const link = event.currentTarget;
    const contactType = link.getAttribute('data-contact-type');
    const contactValue = link.getAttribute('data-contact-value');

    if (!contactType) {
      return;
    }

    // Track click
    trackContactClick(contactType, contactValue);

    // Log for debugging
    console.log('[StoreInfo] Contact method clicked:', {
      type: contactType,
      value: contactValue,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[StoreInfo] Failed to handle contact click:', error);
  }
}

/**
 * Track contact method click
 * @param {string} type - Contact type
 * @param {string} value - Contact value
 * @returns {void}
 */
function trackContactClick(type, value) {
  try {
    const clicks = state.contactMethodClicks.get(type) || 0;
    state.contactMethodClicks.set(type, clicks + 1);

    trackEvent('contact_method_clicked', {
      type,
      value,
      totalClicks: clicks + 1,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[StoreInfo] Failed to track contact click:', error);
  }
}

/**
 * Start periodic status updates
 * @returns {void}
 */
function startStatusUpdates() {
  try {
    if (state.statusUpdateInterval) {
      clearInterval(state.statusUpdateInterval);
    }

    state.statusUpdateInterval = setInterval(() => {
      updateStoreStatus();
    }, CONFIG.STATUS_UPDATE_INTERVAL);

    console.log('[StoreInfo] Status updates started');
  } catch (error) {
    console.error('[StoreInfo] Failed to start status updates:', error);
  }
}

/**
 * Stop periodic status updates
 * @returns {void}
 */
function stopStatusUpdates() {
  if (state.statusUpdateInterval) {
    clearInterval(state.statusUpdateInterval);
    state.statusUpdateInterval = null;
    console.log('[StoreInfo] Status updates stopped');
  }
}

/**
 * Get current time in store timezone
 * @returns {Date} Current time
 */
function getCurrentTime() {
  try {
    // Create date in store timezone
    const now = new Date();
    const timeString = now.toLocaleString('en-US', {
      timeZone: CONFIG.TIMEZONE,
    });
    return new Date(timeString);
  } catch (error) {
    console.warn('[StoreInfo] Timezone conversion failed, using local time:', error);
    return new Date();
  }
}

/**
 * Get day name from date
 * @param {Date} date - Date object
 * @returns {string} Day name
 */
function getDayName(date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (typeof text !== 'string') {
    return '';
  }

  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Track analytics event
 * @param {string} eventName - Event name
 * @param {Object} eventData - Event data
 * @returns {void}
 */
function trackEvent(eventName, eventData) {
  if (!CONFIG.ANALYTICS_ENABLED) {
    return;
  }

  try {
    console.log('[StoreInfo] Event tracked:', eventName, eventData);

    // Integration point for analytics services
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, eventData);
    }

    if (typeof window.analytics === 'object' && typeof window.analytics.track === 'function') {
      window.analytics.track(eventName, eventData);
    }
  } catch (error) {
    console.warn('[StoreInfo] Failed to track event:', error);
  }
}

/**
 * Handle initialization errors
 * @param {Error} error - Error object
 * @returns {void}
 */
function handleInitializationError(error) {
  try {
    console.error('[StoreInfo] Initialization error:', error);

    // Display user-friendly error message
    const errorContainer = document.querySelector('[data-store-info-error]');
    if (errorContainer) {
      errorContainer.innerHTML = `
        <div class="store-info-error">
          <p>Store information is temporarily unavailable.</p>
          <p>Please try refreshing the page or contact us directly.</p>
        </div>
      `;
      errorContainer.style.display = 'block';
    }

    trackEvent('store_info_error', {
      error: error.message,
      stack: error.stack,
      timestamp: Date.now(),
    });
  } catch (handlingError) {
    console.error('[StoreInfo] Error handling failed:', handlingError);
  }
}

/**
 * Cleanup and destroy store info functionality
 * @returns {void}
 */
export function destroyStoreInfo() {
  try {
    console.log('[StoreInfo] Destroying store information module');

    // Stop status updates
    stopStatusUpdates();

    // Remove event listeners
    const contactLinks = document.querySelectorAll('[data-contact-type]');
    contactLinks.forEach((link) => {
      link.removeEventListener('click', handleContactClick);
    });

    // Clear state
    state.initialized = false;
    state.mapLoaded = false;
    state.contactMethodClicks.clear();
    state.lastStatusCheck = null;

    console.log('[StoreInfo] Cleanup complete');
  } catch (error) {
    console.error('[StoreInfo] Cleanup failed:', error);
  }
}

/**
 * Get current store info state
 * @returns {Object} Current state
 */
export function getStoreInfoState() {
  return {
    initialized: state.initialized,
    mapLoaded: state.mapLoaded,
    lastStatusCheck: state.lastStatusCheck,
    contactClicks: Object.fromEntries(state.contactMethodClicks),
  };
}

/**
 * Validate contact form data
 * @param {Object} formData - Form data to validate
 * @returns {Object} Validation result
 */
export function validateContactForm(formData) {
  const errors = {};

  if (!formData.name || formData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!formData.email || !isValidEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (formData.phone && !isValidPhone(formData.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }

  if (!formData.message || formData.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Export public API
 */
export default {
  initStoreInfo,
  destroyStoreInfo,
  getStoreInfoState,
  validateContactForm,
};