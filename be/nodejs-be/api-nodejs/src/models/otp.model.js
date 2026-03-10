'use strict'

import mongoose, { Schema } from 'mongoose'

const DOCUMENT_NAME = 'Otp_Log'
const COLLECTION_NAME = 'Otp_Logs'

const OtpLogSchema = new mongoose.Schema(
  {
    otp_token: { type: String, required: true },
    otp_email: { type: String, required: true },
    otp_status: { type: String, default: 'pending', enum: ['pending', 'active', 'blocked'] },
    expireAt: {
      type: Date,
      default: Date.now,
      expires: 300, // expires in 5 minutes
    },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
)

const OtpLogModel = mongoose.model(DOCUMENT_NAME, OtpLogSchema)
export { OtpLogModel, OtpLogSchema, DOCUMENT_NAME, COLLECTION_NAME }
