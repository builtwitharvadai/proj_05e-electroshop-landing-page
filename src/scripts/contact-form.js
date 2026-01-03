/**
 * Contact Form Module
 * 
 * Handles contact form validation, submission processing, user feedback, and spam prevention.
 * Implements comprehensive client-side validation with accessibility features for screen readers.
 * Provides real-time validation feedback and graceful error handling.
 * 
 * @module scripts/contact-form
 * @generated-from task-id:TASK-005 sprint:store-info-section
 * @modifies DOM elements in contact form section
 * @dependencies [src/data/store-info.js]
 */

import { isValidEmail, isValidPhone } from '../data/store-info.js';

/**
 * Contact form state management
 * @type {Object}
 */
const state = {
  initialized: false,
  isSubmitting: false,
  submissionCount: 0,
  lastSubmissionTime: null,
  validationErrors: new Map(),
  touchedFields: new Set(),
};

/**
 * Configuration constants
 * @type {Object}
 */
const CONFIG = Object.freeze({
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MIN_MESSAGE_LENGTH: 10,
  MAX_MESSAGE_LENGTH: 1000,
  SUBMISSION_COOLDOWN: 30000, // 30 seconds
  MAX_SUBMISSIONS_PER_HOUR: 5,
  DEBOUNCE_DELAY: 300,
  HONEYPOT_FIELD: 'website',
  ANALYTICS_ENABLED: true,
});

/**
 * Validation rules for form fields
 * @type {Object}
 */
const VALIDATION_RULES = Object.freeze({
  name: {
    required: true,
    minLength: CONFIG.MIN_NAME_LENGTH,
    maxLength: CONFIG.MAX_NAME_LENGTH,
    pattern: /^[a-zA-Z\s'-]+$/,
    message: 'Name must contain only letters, spaces, hyphens, and apostrophes',
  },
  email: {
    required: true,
    validator: isValidEmail,
    message: 'Please enter a valid email address',
  },
  phone: {
    required: false,
    validator: isValidPhone,
    message: 'Please enter a valid phone number',
  },
  subject: {
    required: true,
    minLength: 3,
    maxLength: 200,
    message: 'Subject must be between 3 and 200 characters',
  },
  message: {
    required: true,
    minLength: CONFIG.MIN_MESSAGE_LENGTH,
    maxLength: CONFIG.MAX_MESSAGE_LENGTH,
    message: `Message must be between ${CONFIG.MIN_MESSAGE_LENGTH} and ${CONFIG.MAX_MESSAGE_LENGTH} characters`,
  },
});

/**
 * Debounce timer storage
 * @type {Map}
 */
const debounceTimers = new Map();

/**
 * Initialize contact form functionality
 * @returns {void}
 */
export function initContactForm() {
  try {
    if (state.initialized) {
      console.warn('[ContactForm] Already initialized, skipping');
      return;
    }

    console.log('[ContactForm] Initializing contact form module');

    const form = document.querySelector('[data-contact-form]');
    if (!form) {
      console.warn('[ContactForm] Contact form not found');
      return;
    }

    setupFormValidation(form);
    setupFormSubmission(form);
    setupAccessibilityFeatures(form);
    setupHoneypot(form);

    state.initialized = true;
    console.log('[ContactForm] Initialization complete');
  } catch (error) {
    console.error('[ContactForm] Initialization failed:', error);
    handleInitializationError(error);
  }
}

/**
 * Setup form validation with real-time feedback
 * @param {HTMLFormElement} form - Form element
 * @returns {void}
 */
function setupFormValidation(form) {
  try {
    const fields = form.querySelectorAll('input, textarea, select');

    fields.forEach((field) => {
      const fieldName = field.name;
      if (!fieldName || fieldName === CONFIG.HONEYPOT_FIELD) {
        return;
      }

      // Validate on blur
      field.addEventListener('blur', () => {
        state.touchedFields.add(fieldName);
        validateField(field);
      });

      // Real-time validation with debounce
      field.addEventListener('input', () => {
        if (state.touchedFields.has(fieldName)) {
          debounceValidation(field);
        }
      });

      // Clear error on focus
      field.addEventListener('focus', () => {
        clearFieldError(field);
      });
    });

    console.log('[ContactForm] Form validation setup complete');
  } catch (error) {
    console.error('[ContactForm] Failed to setup form validation:', error);
  }
}

/**
 * Setup form submission handling
 * @param {HTMLFormElement} form - Form element
 * @returns {void}
 */
function setupFormSubmission(form) {
  try {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      await handleFormSubmit(form);
    });

    console.log('[ContactForm] Form submission setup complete');
  } catch (error) {
    console.error('[ContactForm] Failed to setup form submission:', error);
  }
}

/**
 * Setup accessibility features
 * @param {HTMLFormElement} form - Form element
 * @returns {void}
 */
function setupAccessibilityFeatures(form) {
  try {
    // Add ARIA live region for form status
    const statusRegion = document.createElement('div');
    statusRegion.setAttribute('role', 'status');
    statusRegion.setAttribute('aria-live', 'polite');
    statusRegion.setAttribute('aria-atomic', 'true');
    statusRegion.className = 'form-status-region visually-hidden';
    statusRegion.setAttribute('data-form-status', '');
    form.appendChild(statusRegion);

    // Ensure all form fields have proper labels
    const fields = form.querySelectorAll('input, textarea, select');
    fields.forEach((field) => {
      const fieldId = field.id || `field-${field.name}`;
      field.id = fieldId;

      const label = form.querySelector(`label[for="${fieldId}"]`);
      if (!label && field.name !== CONFIG.HONEYPOT_FIELD) {
        console.warn(`[ContactForm] Missing label for field: ${field.name}`);
      }

      // Add aria-describedby for error messages
      const errorId = `${fieldId}-error`;
      field.setAttribute('aria-describedby', errorId);
    });

    console.log('[ContactForm] Accessibility features setup complete');
  } catch (error) {
    console.error('[ContactForm] Failed to setup accessibility features:', error);
  }
}

/**
 * Setup honeypot field for spam prevention
 * @param {HTMLFormElement} form - Form element
 * @returns {void}
 */
function setupHoneypot(form) {
  try {
    let honeypot = form.querySelector(`[name="${CONFIG.HONEYPOT_FIELD}"]`);
    
    if (!honeypot) {
      honeypot = document.createElement('input');
      honeypot.type = 'text';
      honeypot.name = CONFIG.HONEYPOT_FIELD;
      honeypot.setAttribute('tabindex', '-1');
      honeypot.setAttribute('autocomplete', 'off');
      honeypot.style.position = 'absolute';
      honeypot.style.left = '-9999px';
      honeypot.style.width = '1px';
      honeypot.style.height = '1px';
      honeypot.setAttribute('aria-hidden', 'true');
      form.appendChild(honeypot);
    }

    console.log('[ContactForm] Honeypot setup complete');
  } catch (error) {
    console.error('[ContactForm] Failed to setup honeypot:', error);
  }
}

/**
 * Validate field with debouncing
 * @param {HTMLElement} field - Field element
 * @returns {void}
 */
function debounceValidation(field) {
  const fieldName = field.name;
  
  if (debounceTimers.has(fieldName)) {
    clearTimeout(debounceTimers.get(fieldName));
  }

  const timer = setTimeout(() => {
    validateField(field);
    debounceTimers.delete(fieldName);
  }, CONFIG.DEBOUNCE_DELAY);

  debounceTimers.set(fieldName, timer);
}

/**
 * Validate individual field
 * @param {HTMLElement} field - Field element
 * @returns {boolean} True if valid
 */
function validateField(field) {
  try {
    const fieldName = field.name;
    const value = field.value.trim();
    const rules = VALIDATION_RULES[fieldName];

    if (!rules) {
      return true;
    }

    // Required field validation
    if (rules.required && !value) {
      setFieldError(field, `${capitalizeFirst(fieldName)} is required`);
      return false;
    }

    // Skip further validation if field is optional and empty
    if (!rules.required && !value) {
      clearFieldError(field);
      return true;
    }

    // Length validation
    if (rules.minLength && value.length < rules.minLength) {
      setFieldError(field, `${capitalizeFirst(fieldName)} must be at least ${rules.minLength} characters`);
      return false;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      setFieldError(field, `${capitalizeFirst(fieldName)} must not exceed ${rules.maxLength} characters`);
      return false;
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      setFieldError(field, rules.message);
      return false;
    }

    // Custom validator
    if (rules.validator && !rules.validator(value)) {
      setFieldError(field, rules.message);
      return false;
    }

    clearFieldError(field);
    return true;
  } catch (error) {
    console.error('[ContactForm] Field validation failed:', error);
    return false;
  }
}

/**
 * Set field error state and message
 * @param {HTMLElement} field - Field element
 * @param {string} message - Error message
 * @returns {void}
 */
function setFieldError(field, message) {
  try {
    const fieldName = field.name;
    state.validationErrors.set(fieldName, message);

    // Update field state
    field.setAttribute('aria-invalid', 'true');
    field.classList.add('field-error');

    // Update or create error message
    const errorId = `${field.id}-error`;
    let errorElement = document.getElementById(errorId);

    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.id = errorId;
      errorElement.className = 'field-error-message';
      errorElement.setAttribute('role', 'alert');
      field.parentNode.appendChild(errorElement);
    }

    errorElement.textContent = message;
    errorElement.style.display = 'block';

    // Announce to screen readers
    announceToScreenReader(`Error: ${message}`);
  } catch (error) {
    console.error('[ContactForm] Failed to set field error:', error);
  }
}

/**
 * Clear field error state
 * @param {HTMLElement} field - Field element
 * @returns {void}
 */
function clearFieldError(field) {
  try {
    const fieldName = field.name;
    state.validationErrors.delete(fieldName);

    field.setAttribute('aria-invalid', 'false');
    field.classList.remove('field-error');

    const errorId = `${field.id}-error`;
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
  } catch (error) {
    console.error('[ContactForm] Failed to clear field error:', error);
  }
}

/**
 * Handle form submission
 * @param {HTMLFormElement} form - Form element
 * @returns {Promise<void>}
 */
async function handleFormSubmit(form) {
  try {
    if (state.isSubmitting) {
      console.warn('[ContactForm] Form submission already in progress');
      return;
    }

    console.log('[ContactForm] Processing form submission');

    // Check spam prevention
    if (!checkSpamPrevention()) {
      showFormMessage('error', 'Please wait before submitting again');
      return;
    }

    // Validate all fields
    const isValid = validateForm(form);
    if (!isValid) {
      showFormMessage('error', 'Please correct the errors before submitting');
      focusFirstError(form);
      return;
    }

    // Check honeypot
    if (!checkHoneypot(form)) {
      console.warn('[ContactForm] Honeypot triggered');
      trackEvent('form_spam_detected', { timestamp: Date.now() });
      showFormMessage('error', 'Submission failed. Please try again');
      return;
    }

    state.isSubmitting = true;
    showFormMessage('loading', 'Sending your message...');
    disableForm(form);

    // Get form data
    const formData = getFormData(form);

    // Simulate form submission (replace with actual API call)
    const result = await submitFormData(formData);

    if (result.success) {
      handleSubmissionSuccess(form);
    } else {
      handleSubmissionError(result.error);
    }
  } catch (error) {
    console.error('[ContactForm] Form submission failed:', error);
    handleSubmissionError(error);
  } finally {
    state.isSubmitting = false;
    enableForm(form);
  }
}

/**
 * Validate entire form
 * @param {HTMLFormElement} form - Form element
 * @returns {boolean} True if valid
 */
function validateForm(form) {
  try {
    const fields = form.querySelectorAll('input, textarea, select');
    let isValid = true;

    fields.forEach((field) => {
      if (field.name && field.name !== CONFIG.HONEYPOT_FIELD) {
        state.touchedFields.add(field.name);
        const fieldValid = validateField(field);
        if (!fieldValid) {
          isValid = false;
        }
      }
    });

    return isValid;
  } catch (error) {
    console.error('[ContactForm] Form validation failed:', error);
    return false;
  }
}

/**
 * Check spam prevention rules
 * @returns {boolean} True if allowed to submit
 */
function checkSpamPrevention() {
  try {
    const now = Date.now();

    // Check cooldown period
    if (state.lastSubmissionTime) {
      const timeSinceLastSubmission = now - state.lastSubmissionTime;
      if (timeSinceLastSubmission < CONFIG.SUBMISSION_COOLDOWN) {
        const remainingSeconds = Math.ceil((CONFIG.SUBMISSION_COOLDOWN - timeSinceLastSubmission) / 1000);
        console.warn(`[ContactForm] Cooldown active: ${remainingSeconds}s remaining`);
        return false;
      }
    }

    // Check submission rate (simple in-memory check)
    if (state.submissionCount >= CONFIG.MAX_SUBMISSIONS_PER_HOUR) {
      console.warn('[ContactForm] Submission rate limit exceeded');
      return false;
    }

    return true;
  } catch (error) {
    console.error('[ContactForm] Spam prevention check failed:', error);
    return true; // Fail open
  }
}

/**
 * Check honeypot field
 * @param {HTMLFormElement} form - Form element
 * @returns {boolean} True if honeypot is empty (not spam)
 */
function checkHoneypot(form) {
  try {
    const honeypot = form.querySelector(`[name="${CONFIG.HONEYPOT_FIELD}"]`);
    return !honeypot || !honeypot.value;
  } catch (error) {
    console.error('[ContactForm] Honeypot check failed:', error);
    return true; // Fail open
  }
}

/**
 * Get form data as object
 * @param {HTMLFormElement} form - Form element
 * @returns {Object} Form data
 */
function getFormData(form) {
  try {
    const formData = new FormData(form);
    const data = {};

    for (const [key, value] of formData.entries()) {
      if (key !== CONFIG.HONEYPOT_FIELD) {
        data[key] = sanitizeInput(value);
      }
    }

    return data;
  } catch (error) {
    console.error('[ContactForm] Failed to get form data:', error);
    return {};
  }
}

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - User input
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Submit form data (simulated - replace with actual API call)
 * @param {Object} formData - Form data
 * @returns {Promise<Object>} Submission result
 */
async function submitFormData(formData) {
  try {
    console.log('[ContactForm] Submitting form data:', formData);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulate success (replace with actual API call)
    return {
      success: true,
      message: 'Message sent successfully',
    };
  } catch (error) {
    console.error('[ContactForm] Form submission API call failed:', error);
    return {
      success: false,
      error: error.message || 'Submission failed',
    };
  }
}

/**
 * Handle successful form submission
 * @param {HTMLFormElement} form - Form element
 * @returns {void}
 */
function handleSubmissionSuccess(form) {
  try {
    console.log('[ContactForm] Form submitted successfully');

    // Update state
    state.lastSubmissionTime = Date.now();
    state.submissionCount += 1;

    // Show success message
    showFormMessage('success', 'Thank you! Your message has been sent successfully. We\'ll get back to you soon.');

    // Reset form
    form.reset();
    state.touchedFields.clear();
    state.validationErrors.clear();

    // Track success
    trackEvent('form_submitted', {
      timestamp: Date.now(),
      submissionCount: state.submissionCount,
    });

    // Announce to screen readers
    announceToScreenReader('Form submitted successfully');
  } catch (error) {
    console.error('[ContactForm] Failed to handle submission success:', error);
  }
}

/**
 * Handle form submission error
 * @param {Error|string} error - Error object or message
 * @returns {void}
 */
function handleSubmissionError(error) {
  try {
    const errorMessage = typeof error === 'string' ? error : error.message;
    console.error('[ContactForm] Form submission error:', errorMessage);

    showFormMessage('error', 'Sorry, there was an error sending your message. Please try again or contact us directly.');

    trackEvent('form_error', {
      error: errorMessage,
      timestamp: Date.now(),
    });

    announceToScreenReader('Form submission failed. Please try again.');
  } catch (handlingError) {
    console.error('[ContactForm] Failed to handle submission error:', handlingError);
  }
}

/**
 * Show form message to user
 * @param {string} type - Message type (success, error, loading)
 * @param {string} message - Message text
 * @returns {void}
 */
function showFormMessage(type, message) {
  try {
    const messageContainer = document.querySelector('[data-form-message]');
    if (!messageContainer) {
      console.warn('[ContactForm] Form message container not found');
      return;
    }

    messageContainer.className = `form-message form-message-${type}`;
    messageContainer.textContent = message;
    messageContainer.style.display = 'block';
    messageContainer.setAttribute('role', type === 'error' ? 'alert' : 'status');

    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        messageContainer.style.display = 'none';
      }, 5000);
    }
  } catch (error) {
    console.error('[ContactForm] Failed to show form message:', error);
  }
}

/**
 * Disable form during submission
 * @param {HTMLFormElement} form - Form element
 * @returns {void}
 */
function disableForm(form) {
  try {
    const fields = form.querySelectorAll('input, textarea, select, button');
    fields.forEach((field) => {
      field.disabled = true;
    });

    form.classList.add('form-submitting');
  } catch (error) {
    console.error('[ContactForm] Failed to disable form:', error);
  }
}

/**
 * Enable form after submission
 * @param {HTMLFormElement} form - Form element
 * @returns {void}
 */
function enableForm(form) {
  try {
    const fields = form.querySelectorAll('input, textarea, select, button');
    fields.forEach((field) => {
      field.disabled = false;
    });

    form.classList.remove('form-submitting');
  } catch (error) {
    console.error('[ContactForm] Failed to enable form:', error);
  }
}

/**
 * Focus first field with error
 * @param {HTMLFormElement} form - Form element
 * @returns {void}
 */
function focusFirstError(form) {
  try {
    const errorField = form.querySelector('[aria-invalid="true"]');
    if (errorField) {
      errorField.focus();
    }
  } catch (error) {
    console.error('[ContactForm] Failed to focus first error:', error);
  }
}

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 * @returns {void}
 */
function announceToScreenReader(message) {
  try {
    const statusRegion = document.querySelector('[data-form-status]');
    if (statusRegion) {
      statusRegion.textContent = message;
      setTimeout(() => {
        statusRegion.textContent = '';
      }, 1000);
    }
  } catch (error) {
    console.error('[ContactForm] Failed to announce to screen reader:', error);
  }
}

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
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
    console.log('[ContactForm] Event tracked:', eventName, eventData);

    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, eventData);
    }

    if (typeof window.analytics === 'object' && typeof window.analytics.track === 'function') {
      window.analytics.track(eventName, eventData);
    }
  } catch (error) {
    console.warn('[ContactForm] Failed to track event:', error);
  }
}

/**
 * Handle initialization errors
 * @param {Error} error - Error object
 * @returns {void}
 */
function handleInitializationError(error) {
  try {
    console.error('[ContactForm] Initialization error:', error);

    const errorContainer = document.querySelector('[data-contact-form-error]');
    if (errorContainer) {
      errorContainer.innerHTML = `
        <div class="contact-form-error">
          <p>Contact form is temporarily unavailable.</p>
          <p>Please contact us directly via phone or email.</p>
        </div>
      `;
      errorContainer.style.display = 'block';
    }

    trackEvent('contact_form_error', {
      error: error.message,
      stack: error.stack,
      timestamp: Date.now(),
    });
  } catch (handlingError) {
    console.error('[ContactForm] Error handling failed:', handlingError);
  }
}

/**
 * Cleanup and destroy contact form functionality
 * @returns {void}
 */
export function destroyContactForm() {
  try {
    console.log('[ContactForm] Destroying contact form module');

    // Clear debounce timers
    debounceTimers.forEach((timer) => clearTimeout(timer));
    debounceTimers.clear();

    // Clear state
    state.initialized = false;
    state.isSubmitting = false;
    state.validationErrors.clear();
    state.touchedFields.clear();

    console.log('[ContactForm] Cleanup complete');
  } catch (error) {
    console.error('[ContactForm] Cleanup failed:', error);
  }
}

/**
 * Get current contact form state
 * @returns {Object} Current state
 */
export function getContactFormState() {
  return {
    initialized: state.initialized,
    isSubmitting: state.isSubmitting,
    submissionCount: state.submissionCount,
    lastSubmissionTime: state.lastSubmissionTime,
    validationErrors: Object.fromEntries(state.validationErrors),
    touchedFields: Array.from(state.touchedFields),
  };
}

/**
 * Export public API
 */
export default {
  initContactForm,
  destroyContactForm,
  getContactFormState,
};