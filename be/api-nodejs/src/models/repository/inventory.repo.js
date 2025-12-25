import { InventoryModel } from '#models/inventory.model.js'

const insertInventory = async ({ productId, shopId, stock, location = 'unknown' }) => {
  return await InventoryModel.create({
    inven_productId: productId,
    inven_shopId: shopId,
    inven_stock: stock,
    inven_location: location,
  })
}

const reservationInventory = async ({ productId, quantity, cartId }) => {
  const query = {
    inven_productId: productId,
    inven_stock: { $gte: quantity },
  }
  
  const updateSet = {
    $inc: { inven_stock: -quantity },
    $push: {
      inven_reservations: {
        cartId,
        quantity,
        reservedAt: new Date(),
      },
    },
  }
  const options = { upsert: true, new: true }
  return await InventoryModel.findOneAndUpdate(query, updateSet, options)
}

export const InventoryRepo = { insertInventory, reservationInventory }
