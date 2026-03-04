'use strict'

import mongoose, { Schema } from 'mongoose'

const DOCUMENT_NAME = 'Resource'
const COLLECTION_NAME = 'Resources'

const resourceSchema = new Schema(
  {
    src_name: { type: String, required: true }, // profile, banner, ...
    src_slug: { type: String, required: true }, //
    src_description: { type: String, default: '' },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
)

const ResourceModel = mongoose.model(DOCUMENT_NAME, resourceSchema)
export { ResourceModel, resourceSchema, DOCUMENT_NAME, COLLECTION_NAME }
