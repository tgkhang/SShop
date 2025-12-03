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
    privateKey: {
      type: String,
      required: true,
      trim: true,
    },
    refreshToken: {
      type: String,
      default: '',
    },
    refreshTokenUsed: {
      type: Array,
      default: [],
    },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  }
)

const KeyTokenModel = model(DOCUMENT_NAME, keyTokenSchema)

export { KeyTokenModel, keyTokenSchema, DOCUMENT_NAME, COLLECTION_NAME }
