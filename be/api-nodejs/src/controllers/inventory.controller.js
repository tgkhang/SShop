import { SuccessResponse } from '#core/success.response.js'
import { InventoryService } from '#services/inventory.service.js'

class InventoryController {
  addStockToInventory = async (req, res, next) => {
    new SuccessResponse({
      message: 'Add stock to inventory successfully!',
      metadata: await InventoryService.addStockToInventory({
        productId: req.body.productId,
        shopId: req.body.shopId,
        stock: req.body.stock,
        location: req.body.location,
      }),
    })
  }
}

export default new InventoryController()
