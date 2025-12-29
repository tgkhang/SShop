import redisPubSubService from '#services/redisPubSub.service.js'

class InventoryServiceTest {
  constructor() {
    redisPubSubService.subscribe('purchase_event', (channel, message) => {
      InventoryServiceTest.updateInventory(message)
    })
  }

  static updateInventory(productId, quantity) {
    console.log(`Updating inventory for product ${productId} with quantity ${quantity}`)
  }
}

export default new InventoryServiceTest()
