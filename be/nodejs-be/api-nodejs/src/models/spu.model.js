'use strict'

import mongoose, { Schema } from 'mongoose'
import slugify from 'slugify'

const { model } = mongoose

const DOCUMENT_NAME = 'Spu'
const COLLECTION_NAME = 'spus'

const spuSchema = new Schema(
  {
    product_id: { type: String, default: '' },
    product_name: { type: String, required: true },
    product_thumb: { type: String, required: true },
    product_description: String,
    product_slug: { type: String },
    product_price: { type: Number, required: true },
    product_quantity: { type: Number, required: true },
    product_category: { type: Array, default: [] },
    product_shop: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    product_attributes: { type: Schema.Types.Mixed, required: true },
    /*
    {
      attribute_id: 12345, // style : vn, korea, japan
      attribute_values: [
        {
          value_id:123
        }
      ]
    }
    */

    //more
    product_ratingsAverage: {
      type: Number,
      default: 4.5,
      min: 1,
      max: 5,
      set: (val) => Math.round(val * 10) / 10, // e.g., 4.6666 => 47 => 4.7
    },
    product_variations: { type: Array, default: [] },
    /*
    product_variation: [
      {
        images:[],
        name:'color'
        options: ['red','blue']
      },
      {
        name:'size'
        options: ['S','M','L']
      }
    ]
    */

    // index now for search
    // select is attribute to include or exclude in query result
    isDraft: { type: Boolean, default: true, index: true, select: false },
    isPublished: { type: Boolean, default: false, index: true, select: false },
    isDeleted: { type: Boolean, default: false, index: true, select: false },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  }
)

// create index for text search
spuSchema.index({ product_name: 'text', product_description: 'text' })

// document middleware: run before .save() and .create()
spuSchema.pre('save', function () {
  // lower is to convert to lowercase e.g. "New Product" => "new-product"
  if (this.product_name && !this.product_slug) {
    this.product_slug = slugify(this.product_name, { lower: true })
  }
})

const SpuModel = model(DOCUMENT_NAME, spuSchema)

export { SpuModel, DOCUMENT_NAME, COLLECTION_NAME }
