import { BadRequestError, NotFoundError } from '#core/error.response.js'

class DiscountValidator {
  constructor(discount) {
    this.discount = discount
    this.errors = []
  }

  validateExists() {
    if (!this.discount) {
      throw new NotFoundError('Discount code not found')
    }
    return this
  }

  validateActive() {
    if (!this.discount || !this.discount.discount_is_active) {
      throw new NotFoundError('Discount code not found or inactive')
    }
    return this
  }

  validateDateRange() {
    const now = new Date()
    const startDate = new Date(this.discount.discount_start_date)
    const endDate = new Date(this.discount.discount_end_date)

    if (now < startDate || now > endDate) {
      throw new BadRequestError('Discount code is not valid in this time range')
    }
    return this
  }

  validateMaxUses() {
    if (!this.discount.discount_max_uses || this.discount.discount_max_uses <= 0) {
      throw new BadRequestError('Discount code has reached its maximum uses')
    }
    return this
  }

  validateMinOrderValue(totalOrder) {
    const minOrderValue = this.discount.discount_min_order_value || 0
    if (minOrderValue > 0 && totalOrder < minOrderValue) {
      throw new BadRequestError(`Order total must be at least ${minOrderValue} to apply this discount`)
    }
    return this
  }

  validateUserUsageLimit(userId) {
    const maxUserUses = this.discount.discount_max_user_uses || 0
    if (maxUserUses > 0) {
      const userUsage = this.discount.discount_users_used?.find((user) => user.userId === userId)
      if (userUsage && userUsage.count >= maxUserUses) {
        throw new BadRequestError('You have reached the maximum uses for this discount code')
      }
    }
    return this
  }

  validateDateRangeForCreation(startDate, endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start >= end) {
      throw new BadRequestError('Start date must be before end date')
    }
    return this
  }

  getDiscount() {
    return this.discount
  }
}

export { DiscountValidator }
