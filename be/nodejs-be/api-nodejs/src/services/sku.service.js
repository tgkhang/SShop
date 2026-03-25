'use strict'

import { NotFoundError } from '#core/error.response.js'
import { SkuModel } from '#models/sku.model.js'
import { SpuModel } from '#models/spu.model.js'
import { randomProductId } from '#utils/index.js'

class SkuService {
  async createNewSku({ spu_id, sku_list }) {
    const convert_sku_list = sku_list.map((sku) => ({
      ...sku,
      product_id: spu_id,
      sku_id: `${spu_id}-${randomProductId()}`,
    }))
    return await SkuModel.create(convert_sku_list)
  }

  async getAllSkusBySpuId({ product_id }) {
    const skus = await SkuModel.find({ product_id, isDeleted: false }).lean().exec()
    return skus
  }

  async getSkuById({ sku_id, product_id }) {
    if (!sku_id || !product_id) {
      throw new NotFoundError('Invalid SKU ID or Product ID')
    }

    const sku = await SkuModel.findOne({ sku_id, product_id }).lean().exec()
    if (!sku) throw new NotFoundError('SKU not found')

    return sku
  }
}

export default new SkuService()
