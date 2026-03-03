'use strict'

import { Schema } from 'mongoose'

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

export { resourceSchema, DOCUMENT_NAME, COLLECTION_NAME }
