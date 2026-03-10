'use strict'

import mongoose, { Schema } from 'mongoose'

const DOCUMENT_NAME = 'User'
const COLLECTION_NAME = 'Users'

const userSchema = new Schema(
  {
    usr_id: { type: Number, required: true, unique: true },
    usr_slug: { type: String, required: true },
    usr_name: { type: String, default: '' },
    usr_password: { type: String, default: '' },
    usr_salf: { type: String, default: '' },
    usr_email: { type: String, required: true, unique: true },
    usr_phone: { type: String, default: '' },
    usr_sex: { type: String, default: '' },
    usr_avatar: { type: String, default: '' },
    usr_date_of_birth: { type: Date, default: null },
    urs_role: { type: Schema.Types.ObjectId, ref: 'Role' },
    usr_status: { type: String, default: 'pending', enum: ['active', 'pending', 'blocked', 'deleted'] },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
)

const UserModel = mongoose.models[DOCUMENT_NAME] || mongoose.model(DOCUMENT_NAME, userSchema)

export { userSchema, UserModel, DOCUMENT_NAME, COLLECTION_NAME }
