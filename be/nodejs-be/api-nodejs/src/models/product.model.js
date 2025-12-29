'use strict'

import mongoose, { Schema } from 'mongoose'
import slugify from 'slugify'

const { model } = mongoose

const DOCUMENT_NAME = 'Product'
const COLLECTION_NAME = 'Products'

const productSchema = new Schema(
  {
    product_name: { type: String, required: true },
    product_thumb: { type: String, required: true },
    product_description: String,
    product_slug: { type: String},
    product_price: { type: Number, required: true },
    product_quantity: { type: Number, required: true },
    product_type: {
      type: String,
      required: true,
      enum: ['Electronics', 'Clothing', 'Furniture'],
    },
    product_shop: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    product_attributes: { type: Schema.Types.Mixed, required: true },
    //more
    product_ratingsAverage: {
      type: Number,
      default: 4.5,
      min: 1,
      max: 5,
      set: (val) => Math.round(val * 10) / 10, // e.g., 4.6666 => 47 => 4.7
    },
    product_variations: { type: Array, default: [] },
    // index now for search
    // select is attribute to include or exclude in query result
    isDraft: { type: Boolean, default: true, index: true, select: false },
    isPublished: { type: Boolean, default: false, index: true, select: false },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  }
)

// create index for text search
productSchema.index({ product_name: 'text', product_description: 'text' })

// document middleware: run before .save() and .create()
productSchema.pre('save', function () {
  // lower is to convert to lowercase e.g. "New Product" => "new-product"
  if (this.product_name && !this.product_slug) {
    this.product_slug = slugify(this.product_name, { lower: true })
  }
})

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

const furnitureSchema = new Schema(
  {
    brand: { type: String, required: true },
    size: String,
    material: String,
    product_shop: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
  },
  {
    collection: 'funitures',
    timestamps: true,
  }
)

const ProductModel = model(DOCUMENT_NAME, productSchema)
const ClothingModel = model('Clothing', clothingSchema)
const ElectronicsModel = model('Electronics', electronicsSchema)
const FurnitureModel = model('Furniture', furnitureSchema)

export {
  ProductModel,
  clothingSchema,
  electronicsSchema,
  furnitureSchema,
  ClothingModel,
  ElectronicsModel,
  FurnitureModel,
  DOCUMENT_NAME,
  COLLECTION_NAME,
}

// in real production, each product type schema would be in its own file, own module for better maintainability
