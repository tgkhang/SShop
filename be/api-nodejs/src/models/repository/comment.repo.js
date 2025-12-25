'use strict'

import { NotFoundError } from '#core/error.response.js'
import { CommentModel } from '#models/comment.model.js'
import { convertToObjectId } from '#utils/index.js'

const findCommentById = async (commentId) => {
  // lean : return plain js object, not mongoose document
  return await CommentModel.findById(convertToObjectId(commentId)).lean().exec()
}

const createComment = async ({ productId, userId, content, parentCommentId, leftValue, rightValue }) => {
  const comment = new CommentModel({
    comment_productId: productId,
    comment_userId: userId,
    comment_content: content,
    comment_parentId: parentCommentId,
    comment_left: leftValue,
    comment_right: rightValue,
  })

  await comment.save()
  return comment
}

/**
 * Find comment with maximum right value for a product
 */
const findMaxRightValue = async (productId) => {
  return await CommentModel.findOne(
    {
      comment_productId: convertToObjectId(productId),
    },
    'comment_right',
    { sort: { comment_right: -1 } }
  ).lean()
}

/**
 * Update right values for comments (used when inserting nested comments)
 */
const updateRightValues = async (productId, rightValue) => {
  return await CommentModel.updateMany(
    {
      comment_productId: convertToObjectId(productId),
      comment_right: { $gte: rightValue },
    },
    {
      $inc: { comment_right: 2 },
    }
  )
}

/**
 * Update left values for comments (used when inserting nested comments)
 */
const updateLeftValues = async (productId, rightValue) => {
  return await CommentModel.updateMany(
    {
      comment_productId: convertToObjectId(productId),
      comment_left: { $gt: rightValue },
    },
    {
      $inc: { comment_left: 2 },
    }
  )
}

/**
 * Get comments by parent ID (nested set query)
 */
const getCommentsByParentId = async ({ productId, parentComment, limit, offset }) => {
  return await CommentModel.find({
    comment_productId: convertToObjectId(productId),
    comment_left: { $gt: parentComment.comment_left },
    comment_right: { $lt: parentComment.comment_right },
  })
    .select({
      comment_left: 1,
      comment_right: 1,
      comment_content: 1,
      comment_parentId: 1,
    })
    .sort({ comment_left: 1 })
    .skip(offset)
    .limit(limit)
    .lean()
    .exec()
}

/**
 * Get root comments (comments without parent)
 */
const getRootComments = async ({ productId, limit, offset }) => {
  return await CommentModel.find({
    comment_productId: convertToObjectId(productId),
    comment_parentId: null,
  })
    .select({
      comment_left: 1,
      comment_right: 1,
      comment_content: 1,
      comment_parentId: 1,
    })
    .sort({ comment_left: 1 })
    .skip(offset)
    .limit(limit)
    .lean()
    .exec()
}

/**
 * Delete comments in a range (used for nested set deletion)
 */
const deleteCommentsInRange = async (productId, leftValue, rightValue) => {
  return await CommentModel.deleteMany({
    comment_productId: convertToObjectId(productId),
    comment_left: { $gte: leftValue },
    comment_right: { $lte: rightValue },
  })
}

/**
 * Update right values after deletion
 */
const updateRightValuesAfterDelete = async (productId, rightValue, width) => {
  return await CommentModel.updateMany(
    {
      comment_productId: convertToObjectId(productId),
      comment_right: { $gt: rightValue },
    },
    {
      $inc: { comment_right: -width },
    }
  )
}

/**
 * Update left values after deletion
 */
const updateLeftValuesAfterDelete = async (productId, rightValue, width) => {
  return await CommentModel.updateMany(
    {
      comment_productId: convertToObjectId(productId),
      comment_left: { $gt: rightValue },
    },
    {
      $inc: { comment_left: -width },
    }
  )
}

export const CommentRepo = {
  findCommentById,
  createComment,
  findMaxRightValue,
  updateRightValues,
  updateLeftValues,
  getCommentsByParentId,
  getRootComments,
  deleteCommentsInRange,
  updateRightValuesAfterDelete,
  updateLeftValuesAfterDelete,
}
