'use strict'

import mongoose, { Schema } from 'mongoose'

const { model } = mongoose

const DOCUMENT_NAME = 'Product'
const COLLECTION_NAME = 'Products'

const productSchema = new Schema(
  {
    product_name: { type: String, required: true },
    product_thumb: { type: String, required: true },
    product_description: String,
    product_price: { type: Number, required: true },
    product_quantity: { type: Number, required: true },
    product_type: {
      type: String,
      required: true,
      enum: ['Electronics', 'Clothing', 'Books', 'Home', 'Beauty', 'Sports', 'Other'],
    },
    product_shop: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    product_attributes: { type: Schema.Types.Mixed, required: true },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  }
)

//define prodcut type clothing
const clothingSchema = new Schema(
  {
    brand: { type: String, required: true },
    size: String,
    material: String,
    product_shop: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
  },
  {
    collection: 'clothes',
    timestamps: true,
  }
)

// electronics schema
// brand: { type: String, required: true },
const electronicsSchema = new Schema(
  {
    manufacturer: { type: String, required: true },
    model: String,
    color: String,
    product_shop: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
  },
  {
    collection: 'electronics',
    timestamps: true,
  }
)

const ProductModel = model(DOCUMENT_NAME, productSchema)
const ClothingModel = model('Clothing', clothingSchema)
const ElectronicsModel = model('Electronics', electronicsSchema)

export {
  ProductModel,
  clothingSchema,
  electronicsSchema,
  ClothingModel,
  ElectronicsModel,
  DOCUMENT_NAME,
  COLLECTION_NAME,
}
