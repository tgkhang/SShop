'use strict'

import mongoose, { Schema } from 'mongoose'
import slugify from 'slugify'

const { model } = mongoose

const DOCUMENT_NAME = 'Sku'
const COLLECTION_NAME = 'skus'

const skuSchema = new Schema(
  {
    sku_id: { type: String, required: true, unique: true },
    sku_tier_idx: { type: Array, default: [0] },
    /*
    color = [red, blue]= [0,1]
    size = [S,M,L] = [0,1,2]
    => sku_tier_idx = [0,0] => color: red, size: S
    => sku_tier_idx = [0,1] => color: red, size: M
    => sku_tier_idx = [0,2] => color: red, size: L
    */
    sku_default: { type: Boolean, default: false }, // for each spu, only 1 sku is default
    sku_slug: { type: String, default: '' },
    sku_sort: { type: Number, default: 0 }, // for sorting in frontend, advertisement, promotion

    sku_price: { type: Number, required: true },
    sku_stock: { type: Number, required: true },
    product_id: { type: String, required: true }, // reference to Spu
    isDraft: { type: Boolean, default: true, index: true, select: false },
    isPublished: { type: Boolean, default: false, index: true, select: false },
    isDeleted: { type: Boolean, default: false, index: true, select: false },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  }
)

const SkuModel = model(DOCUMENT_NAME, skuSchema)

export { SkuModel, DOCUMENT_NAME, COLLECTION_NAME }
