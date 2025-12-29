'use strict'

import { NotFoundError } from '#core/error.response.js'
import { CommentRepo } from '#models/repository/comment.repo.js'
import { ProductRepo } from '#models/repository/product.repo.js'

class CommentService {
  async createComment({ productId, userId, content, parentCommentId = null }) {
    let leftValue, rightValue

    // Case 1: Reply to existing comment
    if (parentCommentId) {
      const parentComment = await CommentRepo.findCommentById(parentCommentId)
      if (!parentComment) throw new NotFoundError('Parent comment not found')

      rightValue = parentComment.comment_right

      // Update existing comments to make space for new nested comment
      await CommentRepo.updateRightValues(productId, rightValue)
      await CommentRepo.updateLeftValues(productId, rightValue)

      leftValue = rightValue
      rightValue = rightValue + 1
    } else {
      // Case 2: New root comment
      const maxRightValue = await CommentRepo.findMaxRightValue(productId)

      if (maxRightValue) {
        leftValue = maxRightValue.comment_right + 1
      } else {
        leftValue = 1
      }

      rightValue = leftValue + 1
    }

    // Create comment via repository
    const comment = await CommentRepo.createComment({
      productId,
      userId,
      content,
      parentCommentId,
      leftValue,
      rightValue,
    })

    return comment
  }

  async getCommentsByParentId({ productId, parentCommentId = null, limit = 10, offset = 0 }) {
    if (parentCommentId) {
      const parentComment = await CommentRepo.findCommentById(parentCommentId)
      if (!parentComment) throw new NotFoundError('Parent comment not found')

      return await CommentRepo.getCommentsByParentId({
        productId,
        parentComment,
        limit,
        offset,
      })
    }

    // Get root comments
    return await CommentRepo.getRootComments({
      productId,
      limit,
      offset,
    })
  }

  async deleteComment({ commentId, productId }) {
    // Verify product exists
    const foundProduct = await ProductRepo.findProduct({ product_id: productId })
    if (!foundProduct) throw new NotFoundError(`Product not found with id: ${productId}`)

    // Find comment and determine left/right values
    const comment = await CommentRepo.findCommentById(commentId)
    if (!comment) throw new NotFoundError('Comment not found')

    const leftValue = comment.comment_left
    const rightValue = comment.comment_right
    const width = rightValue - leftValue + 1

    // Delete comment and all its nested comments
    await CommentRepo.deleteCommentsInRange(productId, leftValue, rightValue)

    // Update remaining comments' left/right values
    await CommentRepo.updateRightValuesAfterDelete(productId, rightValue, width)
    await CommentRepo.updateLeftValuesAfterDelete(productId, rightValue, width)

    return true
  }
}

export default new CommentService()
