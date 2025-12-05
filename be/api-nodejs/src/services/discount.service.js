//admin & shop
// generate code
// delete code

import { BadRequestError, NotFoundError } from '#core/error.response.js'
import { DiscountModel } from '#models/discount.model.js'
import { ProductModel } from '#models/product.model.js'
import { DiscountRepo } from '#models/repository/discount.repo.js'
import { ProductRepo } from '#models/repository/product.repo.js'
import { convertToObjectId } from '#utils/index.js'
import { DiscountBuilder } from '#builders/discount.builder.js'
import { DiscountQueryBuilder } from '#builders/discount.query.builder.js'
import { DiscountValidator } from '#builders/discount.validator.builder.js'

//user
//get discount ammount
//get all disscount code
//verify code
//cancel discount code

class DiscountService {
  static async createDiscountCode(payload) {
    const {
      name,
      code,
      startDate,
      endDate,
      is_active,
      shopId,
      min_order_value,
      product_ids,
      applies_to,
      description,
      type,
      value,
      max_value,
      max_uses,
      uses_count,
      max_uses_per_user,
    } = payload

    if (new Date() < new Date(startDate) || new Date() > new Date(endDate)) {
      throw new BadRequestError('Discount code is not valid in this time range')
    }

    // create index for discount
    const foundDiscount = await DiscountModel.findOne({
      discount_code: code,
      discount_shopId: convertToObjectId(shopId),
    }).lean()

    if (foundDiscount && foundDiscount.discount_is_ative) throw new BadRequestError('Discount code already exists')

    const newDiscount = await DiscountModel.create({
      discount_name: name,
      discount_description: description,
      discount_type: type,
      discount_code: code,
      discount_value: value,
      discount_min_order_value: min_order_value || 0,
      discount_max_value: max_value,
      discount_start_date: new Date(startDate),
      discount_end_date: new Date(endDate),
      discount_max_uses: max_uses || 1,
      discount_uses_count: uses_count || 0,
      discount_users_used: [],
      discount_max_user_uses: max_uses_per_user || 1,
      discount_shopId: shopId,
      discount_is_ative: is_active !== undefined ? is_active : true,
      discount_applies_to: applies_to || 'all_products',
      discount_product_ids: applies_to === 'specific_products' ? product_ids : [],
    })

    return newDiscount
  }

  static async getDiscountByCode({ code, shopId }) {
    //...
  }

  static async getAllDiscountsCodeWithProducts({ code, shopId, userId, limit, page }) {
    const foundDiscount = await DiscountModel.findOne({
      discount_code: code,
      discount_shopId: convertToObjectId(shopId),
    }).lean()

    if (!foundDiscount || !foundDiscount.discount_is_ative) {
      throw new NotFoundError('Discount code not found or inactive')
    }

    const { discount_applies_to, discount_product_ids, discount_start_date, discount_end_date } = foundDiscount
    let products

    if (discount_applies_to === 'all_products') {
      products = await ProductRepo.findAllProducts({
        filter: {
          product_shop: convertToObjectId(shopId),
          isPublished: true,
        },
        limit: +limit,
        page: +page,
        sort: 'ctime',
        select: ['product_name'],
      })
    } else if (discount_applies_to === 'specific_products') {
      products = await ProductRepo.findAllProducts({
        filter: {
          _id: { $in: discount_product_ids },
          product_shop: convertToObjectId(shopId),
          isPublished: true,
        },
        limit: +limit,
        page: +page,
        sort: 'ctime',
        select: ['product_name'],
      })
    }
    return {
      discount: foundDiscount,
      products,
    }
  }

  static async getAllDiscountCodesByShop({ limit, page, shopId }) {
    const discounts = await DiscountRepo.findAllDiscountCodesUnselected({
      limit: +limit,
      page: +page,
      sort: 'ctime',
      filter: {
        discount_shopId: convertToObjectId(shopId),
        discount_is_active: true,
      },
      unSelect: ['__v', 'discount_shopId'],
      model: DiscountModel,
    })
    return discounts
  }

  static async getDiscountAmount({ code, userId, shopId, products }) {
    const foundDiscount = await DiscountRepo.checkDiscountExist({
      model: DiscountModel,
      filter: {
        discount_code: code,
        discount_shopId: convertToObjectId(shopId),
      },
    })

    if (!foundDiscount || !foundDiscount.discount_is_ative) {
      throw new NotFoundError('Discount code not found or inactive')
    }

    const { discount_is_active, discount_max_uses, discount_start_date, discount_end_date, discount_min_order_value } =
      foundDiscount

    if (!discount_is_active) {
      throw new BadRequestError('Discount code is inactive')
    }

    if (!discount_max_uses) throw new BadRequestError('Discount code has reached its maximum uses')

    // can use builder pattern later

    if (new Date() < new Date(discount_start_date) || new Date() > new Date(discount_end_date)) {
      throw new BadRequestError('Discount code is not valid in this time range')
    }

    let totalAmount = 0
    if (discount_min_order_value > 0) {
      totalOrder = products.reduce((acc, product) => {
        return acc + product.price * product.quantity
      }, 0)

      if (totalOrder < discount_min_order_value) {
        throw new BadRequestError(`Order total must be at least ${discount_min_order_value} to apply this discount`)
      }
    }

    if (discount_max_user_uses > 0) {
      const userUsesCount = discount_users_used.find((user) => user.userId === userId)
      if (userUsesCount && userUsesCount.count >= discount_max_user_uses) {
        throw new BadRequestError('You have reached the maximum uses for this discount code')
      }
    }

    // check discont is fixed amount
    const amount = discount_type === 'fixed_amount' ? discount_value : totalOrder * (discount_value / 100)

    return {
      totalOrder,
      discount: amount,
      totalPrice: totalOrder - amount,
    }
  }

  static async deleteDiscountCode({ shopId, codeId }) {
    //simply delete
    const deleteDiscountCode = await DiscountModel.findOneAndDelete({
      discount_code: codeId,
      discount_shopId: convertToObjectId(shopId),
    })
    return deleteDiscountCode

    // another way : find the code first then delete after finding
  }

  static async cancelDiscountCode({ shopId, codeId, userId }) {
    const foundDiscount = await DiscountRepo.checkDiscountExist({
      model: DiscountModel,
      filter: {
        discount_code: codeId,
        discount_shopId: convertToObjectId(shopId),
      },
    })

    //builder pattern later??
    if (!foundDiscount || !foundDiscount.discount_is_ative) {
      throw new NotFoundError('Discount code not found or inactive')
    }

    const result = await DiscountModel.findOneAndUpdate(
      $pull:{
        discount_users_used: { userId: convertToObjectId(userId) }
      }
      $inc: {
        discountmaxuse :1
        discoutn usecoutn -1
      }
      return result
    )
  }
}

export { DiscountService }
