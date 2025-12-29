'use strict'

import { SuccessResponse } from '#core/success.response.js'
import { NotificationService } from '#services/notification.service.js'

class NotificationController {
  /**
   * Get list of notifications for the current user
   */
  getNotifications = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get notifications successfully!',
      metadata: await NotificationService.listNotificationByUser({
        shopId: req.user.userId,
        type: req.query.type || 'ALL',
        isRead: req.query.isRead !== undefined ? parseInt(req.query.isRead) : undefined,
        limit: parseInt(req.query.limit) || 10,
        skip: parseInt(req.query.skip) || 0,
      }),
    }).send(res)
  }

  /**
   * Get unread notification count
   */
  getUnreadCount = async (req, res, next) => {}

  /**
   * Mark notification as read
   */
  markAsRead = async (req, res, next) => {}

  /**
   * Mark multiple notifications as read
   */
  markMultipleAsRead = async (req, res, next) => {}

  /**
   * Mark all notifications as read
   */
  markAllAsRead = async (req, res, next) => {}
}

export default new NotificationController()
