import express from 'express'
import { asyncHandler } from '#helpers/asyncHandler.js'
import { authenticationV2 } from '#auth/authUtils.js'
import notificationController from '#controllers/notification.controller.js'

const router = express.Router()

// TO DO : notification for not authenticated users
//
//

router.use(authenticationV2)

// Get notifications for current user
router.get('', asyncHandler(notificationController.getNotifications))

export const notificationRouter = router
