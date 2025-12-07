'use strict'

import { SuccessResponse } from '#core/success.response.js'
import { DiscountService } from '#services/discount.service.js'

class DiscountController {
  createDiscountCode = async (req, res, next) => {
    new SuccessResponse({
      message: 'Create discount code successfully!',
      metadata: await DiscountService.createDiscountCode({
        ...req.body,
        shopId: req.user.userId,
      }),
    }).send(res)
  }

  getAllDiscountCodes = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get all discount codes successfully!',
      metadata: await DiscountService.getAllDiscountCodesByShop({
        ...req.query,
        shopId: req.user.userId,
      }),
    }).send(res)
  }

  getDiscountAmount = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get discount amount successfully!',
      metadata: await DiscountService.getDiscountAmount({
        ...req.body,
      }),
    }).send(res)
  }

  getAllDiscountCodesWithProducts = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get discount with products successfully!',
      metadata: await DiscountService.getAllDiscountCodesWithProducts({
        ...req.query,
      }),
    }).send(res)
  }
}

export default new DiscountController()
