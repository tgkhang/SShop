'use strict'

import mongoose, { Schema } from 'mongoose'

const DOCUMENT_NAME = 'Discount'
const COLLECTION_NAME = 'Discounts'

const DiscountSchema = new mongoose.Schema(
  {
    discount_name: { type: String, required: true },
    discount_description: { type: String },
    discount_type: { type: String, default: 'fixed_amount' }, // percentage
    discount_value: { type: Number, required: true }, // 10%, $10
    discount_code: { type: String, required: true, unique: true },
    discount_start_date: { type: Date, required: true },
    discount_end_date: { type: Date, required: true },
    discount_max_uses: { type: Number, default: 1 }, // total times the discount can be used
    discount_max_value: { type: Number }, // maximum discount value applicable
    discount_uses_count: { type: Number, default: 0 }, // track how many times the discount has been used
    discount_users_used: [{ type: Schema.Types.ObjectId, ref: 'User' }], // track users who have used the discount
    discount_max_user_uses: { type: Number, default: 1 }, // max uses per user
    discount_min_order_value: { type: Number, default: 0 }, // minimum order value to apply discount
    discount_shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    discount_is_ative: { type: Boolean, default: true },
    discount_applies_to: {
      type: String,
      default: 'all_products',
      enum: ['all_products', 'specific_products'],
    }, // all_products, specific_products, specific_collections
    discount_product_ids: [{ type: Schema.Types.ObjectId, ref: 'Product', default: [] }], // products the discount applies to
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
)

const DiscountModel = mongoose.model(DOCUMENT_NAME, DiscountSchema)

export { DiscountModel, DiscountSchema, DOCUMENT_NAME, COLLECTION_NAME }
