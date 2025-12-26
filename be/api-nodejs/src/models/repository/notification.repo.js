'use strict'

import { NotificationModel } from '#models/notification.model.js'
import { convertToObjectId } from '#utils/index.js'

const findNotificationsByUser = async ({ shopId, type, isRead, limit, skip }) => {
  const query = {
    noti_receiverId: convertToObjectId(shopId),
  }

  // Filter by notification type if specified
  if (type && type !== 'ALL') {
    query.noti_type = type
  }

  // Filter by read status (0 = unread, 1 = read)
  if (isRead !== undefined) {
    query.noti_isRead = isRead === 1
  }

  return await NotificationModel.find(query)
    .populate('noti_senderId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
    .exec()
}

export const NotificationRepo = {
  findNotificationsByUser,
}
