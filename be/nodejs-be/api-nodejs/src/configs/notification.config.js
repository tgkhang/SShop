'use strict'

/**
 * Notification Types
 */
export const NOTIFICATION_TYPES = {
  ORDER_SUCCESS: 'ORDER-001',
  ORDER_FAILED: 'ORDER-002',
  PROMOTION_NEW: 'PROMOTION-001',
  SHOP_NEW_PRODUCT: 'SHOP-001',
}

/**
 * Notification Content Templates
 */
export const NOTIFICATION_CONTENT = {
  [NOTIFICATION_TYPES.ORDER_SUCCESS]: 'Your order has been placed successfully!',
  [NOTIFICATION_TYPES.ORDER_FAILED]: 'Your order has failed. Please try again.',
  [NOTIFICATION_TYPES.PROMOTION_NEW]: '@@@ New promotion is available @@@@',
  [NOTIFICATION_TYPES.SHOP_NEW_PRODUCT]: '@@@ New product have just arrived @@@@',
}

/**
 * Valid notification types array (for schema validation)
 */
export const VALID_NOTIFICATION_TYPES = Object.values(NOTIFICATION_TYPES)
