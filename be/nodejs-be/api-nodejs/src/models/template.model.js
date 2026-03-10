'use strict'

import mongoose, { Schema } from 'mongoose'

const DOCUMENT_NAME = 'Template'
const COLLECTION_NAME = 'Templates'

const TemplateSchema = new mongoose.Schema(
  {
    tem_id: { type: Number, required: true },
    tem_name: { type: String, required: true },
    tem_status: { type: String, default: 'active', enum: ['active', 'inactive'] },
    tem_html: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
)

const TemplateModel = mongoose.model(DOCUMENT_NAME, TemplateSchema)
export { TemplateModel, TemplateSchema, DOCUMENT_NAME, COLLECTION_NAME }
