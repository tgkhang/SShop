'use strict'

import { BadRequestError } from '#core/error.response.js'
import { NotificationModel } from '#models/notification.model.js'
import { NOTIFICATION_TYPES, NOTIFICATION_CONTENT } from '#configs/notification.config.js'
import { convertToObjectId } from '#utils/index.js'
import { NotificationRepo } from '#models/repository/notification.repo.js'

class NotificationService {
  static async pushNotificationToSystem({
    type = NOTIFICATION_TYPES.SHOP_NEW_PRODUCT,
    receiverId,
    senderId,
    options = {},
  }) {
    // Get notification content from constants
    const noti_content = NOTIFICATION_CONTENT[type]

    if (!noti_content) {
      throw new BadRequestError(`Invalid notification type: ${type}`)
    }

    // MOCK: For testing phase - use existing shop IDs
    // Shop 1: Khang TG, Shop 2: Shop2
    if (!receiverId) {
      receiverId = '692c89f99b99687d40001051' // Mock: Shop2 as receiver
    }
    if (!senderId) {
      senderId = '692c89f99b99687d40001051' // Mock: Khang TG as sender
    }

    const newNotification = await NotificationModel.create({
      noti_type: type,
      noti_content,
      noti_senderId: convertToObjectId(senderId),
      noti_receiverId: convertToObjectId(receiverId),
      noti_options: options,
    })

    return newNotification
  }

  static async listNotificationByUser({ shopId, type = 'ALL', isRead, limit = 10, skip = 0 }) {
    const notifications = await NotificationRepo.findNotificationsByUser({
      shopId,
      type,
      isRead,
      limit,
      skip,
    })

    return notifications
  }
}

export { NotificationService }
