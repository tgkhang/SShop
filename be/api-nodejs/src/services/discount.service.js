//admin & shop
// generate code
// delete code

//user
//get discount ammount
//get all disscount code
//verify code
//cancel discount code

import { BadRequestError, NotFoundError } from '#core/error.response.js'
import { DiscountModel } from '#models/discount.model.js'
import { ProductModel } from '#models/product.model.js'
import { DiscountRepo } from '#models/repository/discount.repo.js'
import { ProductRepo } from '#models/repository/product.repo.js'
import { convertToObjectId } from '#utils/index.js'
import { DiscountBuilder } from '#builders/discount.builder.js'
import { DiscountQueryBuilder } from '#builders/discount.query.builder.js'
import { DiscountValidator } from '#builders/discount.validator.builder.js'

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

    // Validate date range using builder pattern
    new DiscountValidator({ discount_start_date: startDate, discount_end_date: endDate }).validateDateRangeForCreation(
      startDate,
      endDate
    )

    // create index for discount
    const foundDiscount = await DiscountModel.findOne({
      discount_code: code,
      discount_shopId: convertToObjectId(shopId),
    }).lean()

    if (foundDiscount && foundDiscount.discount_is_active) throw new BadRequestError('Discount code already exists')

    // Build discount object using builder pattern
    const discountData = new DiscountBuilder()
      .setName(name)
      .setDescription(description)
      .setType(type)
      .setCode(code)
      .setValue(value)
      .setMinOrderValue(min_order_value)
      .setMaxValue(max_value)
      .setStartDate(startDate)
      .setEndDate(endDate)
      .setMaxUses(max_uses)
      .setUsesCount(uses_count)
      .setMaxUserUses(max_uses_per_user)
      .setShopId(shopId)
      .setIsActive(is_active)
      .setAppliesTo(applies_to, product_ids)
      .build()

    const newDiscount = await DiscountModel.create(discountData)

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

    // Validate discount using builder pattern
    new DiscountValidator(foundDiscount).validateActive()

    const { discount_applies_to, discount_product_ids } = foundDiscount

    // Build query using builder pattern
    const queryBuilder = new DiscountQueryBuilder()
      .setShopId(shopId)
      .setPublishedOnly()
      .setLimit(limit)
      .setPage(page)
      .setSort('ctime')
      .setSelect(['product_name'])

    if (discount_applies_to === 'specific_products') {
      queryBuilder.setProductIds(discount_product_ids)
    }

    const products = await queryBuilder.execute()

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

    // Calculate total order value
    const totalOrder = products.reduce((acc, product) => {
      return acc + product.price * product.quantity
    }, 0)

    // Validate discount using builder pattern - chain all validations
    new DiscountValidator(foundDiscount)
      .validateActive()
      .validateMaxUses()
      .validateDateRange()
      .validateMinOrderValue(totalOrder)
      .validateUserUsageLimit(userId)

    const { discount_type, discount_value, discount_max_value } = foundDiscount

    // Calculate discount amount
    let amount = discount_type === 'fixed_amount' ? discount_value : totalOrder * (discount_value / 100)

    // Apply max discount value if specified
    if (discount_max_value && amount > discount_max_value) {
      amount = discount_max_value
    }

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

    // Validate discount using builder pattern
    new DiscountValidator(foundDiscount).validateActive()

    const result = await DiscountModel.findOneAndUpdate(
      {
        discount_code: codeId,
        discount_shopId: convertToObjectId(shopId),
      },
      {
        $pull: {
          discount_users_used: userId,
        },
        $inc: {
          discount_max_uses: 1,
          discount_uses_count: -1,
        },
      },
      { new: true }
    )

    return result
  }
}

export { DiscountService }
