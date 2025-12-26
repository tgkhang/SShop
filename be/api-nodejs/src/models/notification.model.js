'use strict'

import mongoose, { Schema } from 'mongoose'
import { VALID_NOTIFICATION_TYPES } from '#configs/notification.config.js'

const DOCUMENT_NAME = 'Notification'
const COLLECTION_NAME = 'Notifications'

/*
Notification Types:
ORDER-001 : Order success
ORDER-002 : Order failed
PROMOTION-001 : New promotion
SHOP-001 : New product from shop
*/

const NotificationSchema = new mongoose.Schema(
  {
    noti_type: { type: String, enum: VALID_NOTIFICATION_TYPES, required: true },
    noti_senderId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    noti_receiverId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    noti_content: { type: String, default: '' },
    noti_options: { type: Object, default: {} },
    noti_isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
)

const NotificationModel = mongoose.model(DOCUMENT_NAME, NotificationSchema)
export { NotificationModel, NotificationSchema, DOCUMENT_NAME, COLLECTION_NAME }
