import express from 'express'
import { asyncHandler } from '#helpers/asyncHandler.js'
import { authenticationV2 } from '#auth/authUtils.js'
import commentController from '#controllers/comment.controller.js'

const router = express.Router()

router.use(authenticationV2)

router.get('', asyncHandler(commentController.getCommentsByParentId))
router.post('', asyncHandler(commentController.createComment))
router.delete('', asyncHandler(commentController.deleteComment))

export const commentRouter = router
