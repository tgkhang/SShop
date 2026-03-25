'use strict'

import { NotFoundError } from '#core/error.response.js'
import { ShopRepo } from '#models/repository/shop.repo.js'
import { SkuModel } from '#models/sku.model.js'
import { SpuModel } from '#models/spu.model.js'
import { randomProductId } from '#utils/index.js'

import skuService from './sku.service.js'


class SpuService {
  async createNewSpu({
    product_name,
    product_thumb,
    product_description,
    product_price,
    product_category,
    product_shop,
    product_attributes,
    product_quantity,
    product_variations,
    sku_list = [],
  }) {
    // 1. Check shop exists
    const foundShop = await ShopRepo.findShopById({ shopId: product_shop })
    if (!foundShop) throw new NotFoundError('Shop not found')

    // 2. Create SPU
    const newSpu = await SpuModel.create({
      product_id: randomProductId(),
      product_name,
      product_thumb,
      product_description,
      product_price,
      product_category,
      product_shop,
      product_attributes,
      product_quantity,
      product_variations,
    })

    // 3. Create SKUs for the SPU
    if (newSpu && sku_list.length > 0) {
      await skuService.createNewSku({ sku_list, spu_id: newSpu.product_id })
    }

    // 4. sync data via elasticsearch (TODO)

    // 5. Return SPU
    return newSpu
  }

  async getOneSpu({ spu_id }) {
    const spu = await SpuModel.findOne({ product_id: spu_id }).lean()
    if (!spu) throw new NotFoundError('SPU not found')

    const skus = await SkuModel.find({ product_id: spu_id }).lean()
    return { spu, skus }
  }
}

export default new SpuService()
