/**
 * Navigation Module
 * Handles responsive navigation functionality including mobile menu toggle,
 * smooth scrolling, active section highlighting, and accessibility features.
 *
 * @module navigation
 * @generated-from: TASK-002
 * @modifies: DOM navigation elements
 * @dependencies: []
 */

/**
 * Navigation state management
 * @typedef {Object} NavigationState
 * @property {boolean} isMenuOpen - Current menu open state
 * @property {string|null} activeSection - Currently active section ID
 * @property {boolean} isScrolling - Whether programmatic scroll is in progress
 * @property {number|null} scrollTimeout - Timeout ID for scroll debouncing
 */

/**
 * @type {NavigationState}
 */
const state = {
  isMenuOpen: false,
  activeSection: null,
  isScrolling: false,
  scrollTimeout: null,
};

/**
 * Configuration constants
 */
const CONFIG = Object.freeze({
  SCROLL_OFFSET: 80,
  SCROLL_BEHAVIOR: 'smooth',
  DEBOUNCE_DELAY: 100,
  INTERSECTION_THRESHOLD: 0.5,
  FOCUS_TRAP_SELECTOR:
    'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])',
  REDUCED_MOTION_QUERY: '(prefers-reduced-motion: reduce)',
});

/**
 * DOM element cache
 * @type {Object.<string, HTMLElement|NodeList>}
 */
const elements = {
  navigation: null,
  toggle: null,
  menu: null,
  overlay: null,
  links: null,
  sections: null,
};

/**
 * Logs structured messages with context
 * @param {string} level - Log level (info, warn, error)
 * @param {string} message - Log message
 * @param {Object} [context={}] - Additional context
 */
function log(level, message, context = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    module: 'navigation',
    message,
    ...context,
  };

  if (level === 'error') {
    console.error('[Navigation Error]', logEntry);
  } else if (level === 'warn') {
    console.warn('[Navigation Warning]', logEntry);
  } else {
    console.log('[Navigation]', logEntry);
  }
}

/**
 * Safely queries DOM elements with error handling
 * @param {string} selector - CSS selector
 * @param {boolean} [multiple=false] - Whether to query all elements
 * @returns {HTMLElement|NodeList|null} Found element(s) or null
 */
function safeQuerySelector(selector, multiple = false) {
  try {
    return multiple
      ? document.querySelectorAll(selector)
      : document.querySelector(selector);
  } catch (error) {
    log('error', 'Invalid selector', { selector, error: error.message });
    return multiple ? [] : null;
  }
}

/**
 * Initializes DOM element cache
 * @returns {boolean} Success status
 */
function cacheElements() {
  try {
    elements.navigation = safeQuerySelector('.navigation');
    elements.toggle = safeQuerySelector('.navigation__toggle');
    elements.menu = safeQuerySelector('.navigation__menu');
    elements.overlay = safeQuerySelector('.navigation__overlay');
    elements.links = safeQuerySelector('.navigation__link', true);
    elements.sections = safeQuerySelector('section[id]', true);

    const requiredElements = ['navigation', 'toggle', 'menu', 'overlay'];
    const missingElements = requiredElements.filter((key) => !elements[key]);

    if (missingElements.length > 0) {
      log('error', 'Required navigation elements not found', {
        missing: missingElements,
      });
      return false;
    }

    log('info', 'Navigation elements cached successfully', {
      linksCount: elements.links.length,
      sectionsCount: elements.sections.length,
    });

    return true;
  } catch (error) {
    log('error', 'Failed to cache elements', { error: error.message });
    return false;
  }
}

/**
 * Checks if user prefers reduced motion
 * @returns {boolean} True if reduced motion is preferred
 */
function prefersReducedMotion() {
  return window.matchMedia(CONFIG.REDUCED_MOTION_QUERY).matches;
}

/**
 * Gets focusable elements within a container
 * @param {HTMLElement} container - Container element
 * @returns {HTMLElement[]} Array of focusable elements
 */
function getFocusableElements(container) {
  if (!container) return [];

  const focusable = container.querySelectorAll(CONFIG.FOCUS_TRAP_SELECTOR);
  return Array.from(focusable).filter(
    (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
  );
}

/**
 * Traps focus within the mobile menu
 * @param {KeyboardEvent} event - Keyboard event
 */
function trapFocus(event) {
  if (!state.isMenuOpen || event.key !== 'Tab') return;

  const focusableElements = getFocusableElements(elements.menu);
  if (focusableElements.length === 0) return;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

/**
 * Toggles mobile menu open/closed state
 * @param {boolean} [forceState] - Optional forced state
 */
function toggleMenu(forceState) {
  const newState = forceState ?? !state.isMenuOpen;

  state.isMenuOpen = newState;

  // Update ARIA attributes
  elements.toggle.setAttribute('aria-expanded', String(newState));
  elements.menu.setAttribute('data-state', newState ? 'open' : 'closed');
  elements.overlay.setAttribute('data-state', newState ? 'open' : 'closed');

  // Manage body scroll
  if (newState) {
    document.body.style.overflow = 'hidden';
    // Focus first link in menu
    const firstLink = elements.menu.querySelector('.navigation__link');
    if (firstLink) {
      setTimeout(() => firstLink.focus(), 100);
    }
  } else {
    document.body.style.overflow = '';
    // Return focus to toggle button
    elements.toggle.focus();
  }

  log('info', 'Menu toggled', { isOpen: newState });
}

/**
 * Closes mobile menu
 */
function closeMenu() {
  if (state.isMenuOpen) {
    toggleMenu(false);
  }
}

/**
 * Handles escape key to close menu
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleEscapeKey(event) {
  if (event.key === 'Escape' && state.isMenuOpen) {
    closeMenu();
  }
}

/**
 * Smoothly scrolls to a target element
 * @param {HTMLElement} target - Target element to scroll to
 * @returns {Promise<void>}
 */
function smoothScrollTo(target) {
  return new Promise((resolve) => {
    if (!target) {
      resolve();
      return;
    }

    state.isScrolling = true;

    const targetPosition =
      target.getBoundingClientRect().top +
      window.pageYOffset -
      CONFIG.SCROLL_OFFSET;

    const scrollOptions = {
      top: targetPosition,
      behavior: prefersReducedMotion() ? 'auto' : CONFIG.SCROLL_BEHAVIOR,
    };

    window.scrollTo(scrollOptions);

    // Reset scrolling flag after animation completes
    setTimeout(() => {
      state.isScrolling = false;
      resolve();
    }, prefersReducedMotion() ? 0 : 500);
  });
}

/**
 * Handles navigation link clicks
 * @param {Event} event - Click event
 */
async function handleLinkClick(event) {
  const link = event.currentTarget;
  const href = link.getAttribute('href');

  // Only handle internal anchor links
  if (!href || !href.startsWith('#')) return;

  event.preventDefault();

  const targetId = href.slice(1);
  const targetSection = document.getElementById(targetId);

  if (!targetSection) {
    log('warn', 'Target section not found', { targetId });
    return;
  }

  // Close mobile menu if open
  closeMenu();

  // Perform smooth scroll
  try {
    await smoothScrollTo(targetSection);
    updateActiveLink(targetId);

    // Update URL without triggering scroll
    if (history.pushState) {
      history.pushState(null, '', href);
    }

    log('info', 'Navigated to section', { targetId });
  } catch (error) {
    log('error', 'Scroll failed', { targetId, error: error.message });
  }
}

/**
 * Updates active link styling
 * @param {string} sectionId - Active section ID
 */
function updateActiveLink(sectionId) {
  if (state.activeSection === sectionId) return;

  state.activeSection = sectionId;

  elements.links.forEach((link) => {
    const href = link.getAttribute('href');
    const isActive = href === `#${sectionId}`;

    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  log('info', 'Active link updated', { sectionId });
}

/**
 * Determines which section is currently in view
 * @returns {string|null} Active section ID or null
 */
function getCurrentSection() {
  const scrollPosition = window.pageYOffset + CONFIG.SCROLL_OFFSET + 100;

  let currentSection = null;

  elements.sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionBottom = sectionTop + section.offsetHeight;

    if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
      currentSection = section.id;
    }
  });

  return currentSection;
}

/**
 * Handles scroll events with debouncing
 */
function handleScroll() {
  // Don't update during programmatic scrolling
  if (state.isScrolling) return;

  // Add scrolled class to navigation
  if (window.pageYOffset > 50) {
    elements.navigation.classList.add('scrolled');
  } else {
    elements.navigation.classList.remove('scrolled');
  }

  // Debounce section detection
  if (state.scrollTimeout) {
    clearTimeout(state.scrollTimeout);
  }

  state.scrollTimeout = setTimeout(() => {
    const currentSection = getCurrentSection();
    if (currentSection) {
      updateActiveLink(currentSection);
    }
  }, CONFIG.DEBOUNCE_DELAY);
}

/**
 * Sets up Intersection Observer for section detection (progressive enhancement)
 */
function setupIntersectionObserver() {
  if (!('IntersectionObserver' in window)) {
    log('info', 'IntersectionObserver not supported, using scroll fallback');
    return;
  }

  try {
    const observerOptions = {
      rootMargin: `-${CONFIG.SCROLL_OFFSET}px 0px -50% 0px`,
      threshold: CONFIG.INTERSECTION_THRESHOLD,
    };

    const observer = new IntersectionObserver((entries) => {
      if (state.isScrolling) return;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          updateActiveLink(entry.target.id);
        }
      });
    }, observerOptions);

    elements.sections.forEach((section) => {
      observer.observe(section);
    });

    log('info', 'IntersectionObserver initialized', {
      sectionsCount: elements.sections.length,
    });
  } catch (error) {
    log('error', 'Failed to setup IntersectionObserver', {
      error: error.message,
    });
  }
}

/**
 * Handles window resize events
 */
function handleResize() {
  // Close mobile menu on resize to desktop
  if (window.innerWidth >= 768 && state.isMenuOpen) {
    closeMenu();
  }
}

/**
 * Sets up keyboard navigation
 */
function setupKeyboardNavigation() {
  document.addEventListener('keydown', handleEscapeKey);
  document.addEventListener('keydown', trapFocus);

  // Arrow key navigation within menu
  elements.menu.addEventListener('keydown', (event) => {
    if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return;

    event.preventDefault();

    const focusableElements = getFocusableElements(elements.menu);
    const currentIndex = focusableElements.indexOf(document.activeElement);

    if (currentIndex === -1) return;

    let nextIndex;
    if (event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % focusableElements.length;
    } else {
      nextIndex =
        (currentIndex - 1 + focusableElements.length) %
        focusableElements.length;
    }

    focusableElements[nextIndex].focus();
  });

  log('info', 'Keyboard navigation initialized');
}

/**
 * Attaches event listeners to navigation elements
 */
function attachEventListeners() {
  try {
    // Toggle button
    elements.toggle.addEventListener('click', () => toggleMenu());

    // Overlay click to close
    elements.overlay.addEventListener('click', closeMenu);

    // Navigation links
    elements.links.forEach((link) => {
      link.addEventListener('click', handleLinkClick);
    });

    // Scroll handling
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Resize handling
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, CONFIG.DEBOUNCE_DELAY);
    });

    // Keyboard navigation
    setupKeyboardNavigation();

    log('info', 'Event listeners attached successfully');
  } catch (error) {
    log('error', 'Failed to attach event listeners', { error: error.message });
    throw error;
  }
}

/**
 * Initializes navigation on page load
 */
function initializeNavigation() {
  try {
    log('info', 'Initializing navigation module');

    // Cache DOM elements
    if (!cacheElements()) {
      throw new Error('Failed to cache required DOM elements');
    }

    // Set initial ARIA states
    elements.toggle.setAttribute('aria-expanded', 'false');
    elements.toggle.setAttribute('aria-controls', 'navigation-menu');
    elements.toggle.setAttribute('aria-label', 'Toggle navigation menu');
    elements.menu.setAttribute('id', 'navigation-menu');
    elements.menu.setAttribute('data-state', 'closed');
    elements.overlay.setAttribute('data-state', 'closed');

    // Attach event listeners
    attachEventListeners();

    // Setup intersection observer for section detection
    setupIntersectionObserver();

    // Set initial active section
    const initialSection = getCurrentSection();
    if (initialSection) {
      updateActiveLink(initialSection);
    }

    log('info', 'Navigation initialized successfully', {
      linksCount: elements.links.length,
      sectionsCount: elements.sections.length,
    });
  } catch (error) {
    log('error', 'Navigation initialization failed', {
      error: error.message,
      stack: error.stack,
    });
    // Don't throw - allow page to function without enhanced navigation
  }
}

/**
 * Cleanup function for navigation (useful for SPA scenarios)
 */
function cleanup() {
  try {
    // Remove event listeners
    elements.toggle?.removeEventListener('click', toggleMenu);
    elements.overlay?.removeEventListener('click', closeMenu);
    elements.links?.forEach((link) => {
      link.removeEventListener('click', handleLinkClick);
    });
    window.removeEventListener('scroll', handleScroll);
    document.removeEventListener('keydown', handleEscapeKey);
    document.removeEventListener('keydown', trapFocus);

    // Clear timeouts
    if (state.scrollTimeout) {
      clearTimeout(state.scrollTimeout);
    }

    // Reset state
    state.isMenuOpen = false;
    state.activeSection = null;
    state.isScrolling = false;
    state.scrollTimeout = null;

    // Restore body scroll
    document.body.style.overflow = '';

    log('info', 'Navigation cleanup completed');
  } catch (error) {
    log('error', 'Navigation cleanup failed', { error: error.message });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeNavigation);
} else {
  initializeNavigation();
}

// Export for module usage
export { initializeNavigation, cleanup, toggleMenu, closeMenu };