import { Schema } from 'mongoose'

const DOCUMENT_NAME = 'Shop'
const COLLECTION_NAME = 'Shops'

var shopSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'inactive',
    },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  }
)

export { shopSchema, DOCUMENT_NAME, COLLECTION_NAME }
