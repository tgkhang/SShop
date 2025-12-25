'use strict'

import { NotFoundError, BadRequestError } from '#core/error.response.js'
import { InventoryRepo } from '#models/repository/inventory.repo.js'
import { ProductRepo } from '#models/repository/product.repo.js'

class InventoryService {
  static async addStockToInventory({ productId, shopId, stock, location = '123 nvc' }) {
    const product = await ProductRepo.getProductById({ productId })

    if (!product) throw new NotFoundError('Product not found')

    return await InventoryRepo.insertInventory({ productId, shopId, stock, location })
  }
}

export { InventoryService }
