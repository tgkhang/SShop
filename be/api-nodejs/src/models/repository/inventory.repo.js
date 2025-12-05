import { InventoryModel } from '#models/inventory.model.js'

const insertInventory = async ({ productId, shopId, stock, location = 'unknown' }) => {
  return await InventoryModel.create({
    inven_productId: productId,
    inven_shopId: shopId,
    inven_stock: stock,
    inven_location: location,
  })
}

export const InventoryRepo = { insertInventory }
