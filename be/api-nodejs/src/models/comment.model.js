'use strict'

import mongoose, { Schema } from 'mongoose'

const DOCUMENT_NAME = 'Comment'
const COLLECTION_NAME = 'Comments'

const CommentSchema = new mongoose.Schema(
  {
    comment_productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    comment_userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    comment_content: { type: String, default: '' },
    comment_left: { type: Number, default: 0 },
    comment_right: { type: Number, default: 0 },
    comment_parentId: { type: Schema.Types.ObjectId, ref: DOCUMENT_NAME },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
)

const CommentModel = mongoose.model(DOCUMENT_NAME, CommentSchema)
export { CommentModel, CommentSchema, DOCUMENT_NAME, COLLECTION_NAME }
