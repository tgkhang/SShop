'use strict'

import { Schema, model } from 'mongoose'

const DOCUMENT_NAME = 'Key'
const COLLECTION_NAME = 'Keys'

// Declare the Schema of the Mongo model
var keyTokenSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Shop',
    },
    publicKey: {
      type: String,
      required: true,
      trim: true,
    },
    refreshToken: {
      type: Array,
      default: [],
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  }
)

export { keyTokenSchema, DOCUMENT_NAME, COLLECTION_NAME }
