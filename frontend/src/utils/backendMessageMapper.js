/**
 * Frontend Backend Message Mapper
 * 
 * Maps backend message codes and error codes to i18next translation keys.
 * This allows the backend to return stable codes while the frontend
 * displays the appropriate translated message.
 */

const CODE_TO_TRANSLATION_KEY = {
  // Auth messages
  AUTH_REGISTERED: 'auth.registeredSuccess',
  AUTH_LOGGED_IN: 'auth.loggedInSuccess',
  AUTH_LOGGED_OUT: 'auth.loggedOutSuccess',
  AUTH_PASSWORD_CHANGED: 'auth.passwordChanged',
  AUTH_PASSWORD_MISMATCH: 'auth.passwordMismatch',
  AUTH_OTP_SENT: 'auth.otpSent',
  AUTH_OTP_VERIFIED: 'auth.otpVerified',
  AUTH_OTP_INVALID: 'auth.invalidOtp',
  AUTH_OTP_EXPIRED: 'auth.otpExpired',
  AUTH_PROFILE_FETCHED: 'auth.profileFetched',
  AUTH_PROFILE_UPDATED: 'auth.profileUpdated',
  DASHBOARD_LOADED: 'dashboard.welcome',
  AUTH_VERIFICATION_REQUIRED: 'auth.verificationRequired',
  AUTH_VERIFICATION_EXPIRED: 'auth.verificationExpired',

  // Cart messages
  CART_FETCHED: 'cart.fetched',
  CART_ITEM_ADDED: 'cart.itemAdded',
  CART_ITEM_UPDATED: 'cart.itemUpdated',
  CART_ITEM_REMOVED: 'cart.itemRemoved',
  CART_CLEARED: 'cart.cleared',

  // Order messages
  ORDER_PLACED: 'order.placedSuccess',
  ORDER_FETCHED: 'order.fetched',
  ORDER_UPDATED: 'order.updated',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_NOT_FOUND: 'order.notFound',
  ORDER_TRACKED: 'order.tracked',
  ORDER_RETURN_REQUESTED: 'order.returnRequested',
  ORDER_REFUNDED: 'order.refunded',
  ORDER_ALREADY_PAID: 'payment.alreadyVerified',
  RETURN_SUBMITTED: 'return.submitted',
  REFUND_PROCESSED: 'refund.processed',

  // Payment messages
  PAYMENT_ORDER_CREATED: 'payment.orderCreated',
  PAYMENT_VERIFIED: 'payment.verified',
  PAYMENT_ALREADY_VERIFIED: 'payment.alreadyVerified',
  PAYMENT_DETAILS_FETCHED: 'payment.detailsFetched',
  PAYMENT_FAILED: 'payment.failed',

  // Coupon messages
  COUPON_APPLIED: 'coupon.applied',
  COUPON_REMOVED: 'coupon.removed',
  COUPON_FETCHED: 'coupon.fetched',
  COUPON_AVAILABLE_FETCHED: 'coupon.availableFetched',
  COUPON_VALIDATED: 'coupon.validated',
  COUPON_CART_TOTALS: 'coupon.cartTotals',

  // Wishlist messages
  WISHLIST_FETCHED: 'wishlist.fetched',
  WISHLIST_ITEM_ADDED: 'wishlist.itemAdded',
  WISHLIST_ITEM_REMOVED: 'wishlist.itemRemoved',

  // Notification messages
  NOTIFICATIONS_FETCHED: 'notifications.fetched',
  NOTIFICATION_MARKED_READ: 'notifications.markedRead',
  NOTIFICATION_ALL_MARKED_READ: 'notifications.allMarkedRead',
  NOTIFICATION_DELETED: 'notifications.deleted',
  NOTIFICATIONS_CLEARED: 'notifications.cleared',
  UNREAD_COUNT_FETCHED: 'notifications.unreadCountFetched',

  // Review messages
  REVIEW_SUBMITTED: 'review.submitted',
  REVIEW_FETCHED: 'review.fetched',
  REVIEW_COUNTS_FETCHED: 'review.countsFetched',

  // Contact messages
  CONTACT_MESSAGE_SENT: 'contact.messageSent',

  // Product messages
  PRODUCTS_FETCHED: 'product.fetched',
  PRODUCT_FETCHED: 'product.singleFetched',
  PRODUCT_NOT_FOUND: 'product.notFound',

  // Category messages
  CATEGORIES_FETCHED: 'category.fetched',
  OFFERS_FETCHED: 'offers.fetched',

  // Smart Home messages
  SMART_HOME_PLAN_SUBMITTED: 'smartHome.planSubmitted',
  SMART_HOME_PLAN_FETCHED: 'smartHome.planFetched',
  SMART_HOME_STEP_SAVED: 'planner.saved',
  SMART_HOME_SESSION_FOUND: 'planner.sessionFound',

  // Search messages
  SEARCH_READY: 'product.fetched',
  SEARCH_RESULTS_FETCHED: 'product.fetched',

  // General messages
  GENERIC_SUCCESS: 'common.success',
  GENERIC_ERROR: 'common.error',
  VALIDATION_ERROR: 'common.validationError',
  UNAUTHORIZED: 'common.unauthorized',
  FORBIDDEN: 'common.forbidden',
  NOT_FOUND: 'common.notFound',
  SERVER_ERROR: 'common.serverError',
  AUTH_REQUIRED: 'common.unauthorized',
  INVALID_TOKEN: 'auth.invalidSession',
  INVALID_SESSION: 'auth.invalidSession',
  ADMIN_AUTH_REQUIRED: 'common.unauthorized',
  ADMIN_FORBIDDEN: 'common.forbidden',
  INVALID_ADMIN_SESSION: 'auth.invalidSession',

  // Error codes (from AppError)
  WEAK_PASSWORD: 'auth.weakPassword',
  INVALID_EMAIL: 'auth.invalidEmail',
  INVALID_PASSWORD: 'auth.invalidPassword',
  USER_NOT_FOUND: 'auth.userNotFound',
  EMAIL_EXISTS: 'auth.emailExists',
  INSUFFICIENT_STOCK: 'cart.insufficientStock',
  PRODUCT_UNAVAILABLE: 'cart.productUnavailable',
  CART_EMPTY: 'cart.cartEmpty',
  COUPON_INVALID: 'coupon.invalid',
  COUPON_EXPIRED: 'coupon.expired',
  COUPON_MINIMUM_NOT_MET: 'coupon.minimumNotMet',

  // Password change / OTP codes
  OTP_RATE_LIMITED: 'password.otpWait',
  OTP_COOLDOWN: 'password.otpWait',
  OTP_INVALID: 'password.invalidOtp',
};

/**
 * Get translation key for a backend message code
 * @param {string} code - The message/error code from backend
 * @returns {string|null} - The translation key or null
 */
export const getTranslationKey = (code) => {
  if (!code) return null;
  return CODE_TO_TRANSLATION_KEY[code] || null;
};

/**
 * Extract a translatable message from an API error response
 * @param {object} error - The error object from apiCall
 * @param {function} t - The i18next translation function
 * @param {string} fallbackKey - Fallback translation key if code not found
 * @returns {string} - The translated message
 */
export const getErrorMessage = (error, t, fallbackKey = 'common.somethingWentWrong') => {
  if (!error) return t(fallbackKey);
  
  // First try to use the translationKey from the response
  if (error.translationKey) {
    const translated = t(error.translationKey);
    if (translated && translated !== error.translationKey) {
      return translated;
    }
  }
  
  // Then try to map the error code
  if (error.code) {
    const key = getTranslationKey(error.code);
    if (key) {
      const translated = t(key);
      if (translated && translated !== key) {
        return translated;
      }
    }
  }
  
  // Fallback to the raw message or generic error
  return error.message || t(fallbackKey);
};

export default {
  getTranslationKey,
  getErrorMessage,
};
