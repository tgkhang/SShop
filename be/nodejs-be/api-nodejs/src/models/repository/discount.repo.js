'use strict'

import { DiscountModel } from '#models/discount.model.js'
import { NotFoundError } from '#core/error.response.js'

const findAllDiscountCodesUnselected = async ({ limit = 50, page = 1, sort = 'ctime', filter, unSelect, model }) => {
  const skip = (page - 1) * limit
  const sortBy = sort === 'ctime' ? { createdAt: -1 } : { discount_name: sort === 'asc' ? 1 : -1 }

  const products = await DiscountModel.find(filter)
    .sort(sortBy)
    .skip(skip)
    .limit(limit)
    .select(unSelect.map(field => `-${field}`).join(' '))
    .lean()
    .exec()

  return products
}

const findAllDiscountCodesSelected = async ({ limit = 50, page = 1, sort = 'ctime', filter, select = [], model }) => {
  const skip = (page - 1) * limit
  const sortBy = sort === 'ctime' ? { createdAt: -1 } : { discount_name: sort === 'asc' ? 1 : -1 }

  const products = await DiscountModel.find(filter)
    .sort(sortBy)
    .skip(skip)
    .limit(limit)
    .select(select.join(' '))
    .lean()
    .exec()

  return products
}

const checkDiscountExist = async ({ model, filter, lean = true }) => {
  const foundDiscount = await model.findOne(filter).lean(lean)

  if (!foundDiscount) {
    throw new NotFoundError('Discount not found')
  }

  return foundDiscount
}

export const DiscountRepo = { findAllDiscountCodesUnselected, findAllDiscountCodesSelected, checkDiscountExist }
