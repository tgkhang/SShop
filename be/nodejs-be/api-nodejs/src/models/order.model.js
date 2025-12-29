'use strict'

import mongoose, { Schema } from 'mongoose'

const DOCUMENT_NAME = 'Order'
const COLLECTION_NAME = 'Orders'

const OrderSchema = new mongoose.Schema(
  {
    order_userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    order_checkout: { type: Object, default: {} },
    /*
  order_checkout: {
    totalPrice,
    feeShip,
    totalApplyDiscount,
 }
  */
    order_shipping: { type: Object, default: {} }, // street, city, state, country
    order_payment: { type: Object, default: {} }, // method, status, transactionId
    order_products: { type: Array, required: true },
    order_trackingNumber: { type: String, default: '#0001922025 ' },
    order_status: {
      type: String,
      required: true,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
      default: 'pending',
    },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
    timeseries: {
      createdAt: 'createdOn',
      updatedAt: 'modifiedOn',
    },
  }
)

const OrderModel = mongoose.model(DOCUMENT_NAME, OrderSchema)

export { OrderModel, OrderSchema, DOCUMENT_NAME, COLLECTION_NAME }
