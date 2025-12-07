'use strict'

import mongoose, { Schema } from 'mongoose'

const DOCUMENT_NAME = 'Cart'
const COLLECTION_NAME = 'Carts'

const CartSchema = new mongoose.Schema(
  {
    cart_state: {
      type: String,
      required: true,
      enum: ['active', 'completed', 'pending', 'failed', 'abandoned'],
      default: 'active',
    },
    cart_products: { type: Array, default: [] },
    /*
  productId, shopId, quantity, price, name
  */
    cart_count_products: { type: Number, default: 0 },
    cart_userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
    // timeseries: {
    //   timeField: 'createdAt',
    //   metaField: 'cart_userId',
    //   granularity: 'hours',
    // },
  }
)

const CartModel = mongoose.model(DOCUMENT_NAME, CartSchema)

export { CartModel, CartSchema, DOCUMENT_NAME, COLLECTION_NAME }
