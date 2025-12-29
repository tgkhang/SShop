'use strict'

import { SuccessResponse } from '#core/success.response.js'
import commentService from '#services/comment.service.js'

class CommentController {
  createComment = async (req, res, next) => {
    new SuccessResponse({
      message: 'Comment created successfully!',
      metadata: await commentService.createComment(req.body),
    }).send(res)
  }

  getCommentsByParentId = async (req, res, next) => {
    new SuccessResponse({
      message: 'Comments retrieved successfully!',
      metadata: await commentService.getCommentsByParentId(req.query),
    }).send(res)
  }

  deleteComment = async (req, res, next) => {
    new SuccessResponse({
      message: 'Comment deleted successfully!',
      metadata: await commentService.deleteComment(req.body),
    }).send(res)
  }
}

export default new CommentController()
