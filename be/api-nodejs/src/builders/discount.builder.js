class DiscountBuilder {
  constructor() {
    this.discountData = {
      discount_users_used: [],
    }
  }

  setName(name) {
    this.discountData.discount_name = name
    return this
  }

  setDescription(description) {
    this.discountData.discount_description = description
    return this
  }

  setType(type) {
    this.discountData.discount_type = type
    return this
  }

  setCode(code) {
    this.discountData.discount_code = code
    return this
  }

  setValue(value) {
    this.discountData.discount_value = value
    return this
  }

  setMinOrderValue(minOrderValue) {
    this.discountData.discount_min_order_value = minOrderValue || 0
    return this
  }

  setMaxValue(maxValue) {
    this.discountData.discount_max_value = maxValue
    return this
  }

  setStartDate(startDate) {
    this.discountData.discount_start_date = new Date(startDate)
    return this
  }

  setEndDate(endDate) {
    this.discountData.discount_end_date = new Date(endDate)
    return this
  }

  setMaxUses(maxUses) {
    this.discountData.discount_max_uses = maxUses || 1
    return this
  }

  setUsesCount(usesCount) {
    this.discountData.discount_uses_count = usesCount || 0
    return this
  }

  setMaxUserUses(maxUserUses) {
    this.discountData.discount_max_user_uses = maxUserUses || 1
    return this
  }

  setShopId(shopId) {
    this.discountData.discount_shopId = shopId
    return this
  }

  setIsActive(isActive) {
    this.discountData.discount_is_active = isActive !== undefined ? isActive : true
    return this
  }

  setAppliesTo(appliesTo, productIds = []) {
    this.discountData.discount_applies_to = appliesTo || 'all_products'
    this.discountData.discount_product_ids = appliesTo === 'specific_products' ? productIds : []
    return this
  }

  build() {
    return this.discountData
  }
}

export { DiscountBuilder }
