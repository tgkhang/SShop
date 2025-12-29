'use strict'

import mongoose, { Schema } from "mongoose"

const DOCUMENT_NAME = 'ApiKey'
const COLLECTION_NAME = 'ApiKeys'

const apiKeySchema = new Schema({
  key:{
    type: String,
    required: true,
    unique: true
  },
  // key is active or not
  status:{
    type: Boolean,
    default: true
  },
  permissions:{
    type: [String],
    required: true,
    enum: ['read', 'write', 'delete']
  },
  createdAt:{
    type: Date,
    default: Date.now,
    expires: '30d' // Key expires after 30 days
  },
},{
  timestamps: true,
  collection: COLLECTION_NAME
})

export default mongoose.model(DOCUMENT_NAME, apiKeySchema)