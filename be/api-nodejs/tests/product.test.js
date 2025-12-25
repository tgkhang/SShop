import RedisPubSubService from '#services/redisPubSub.service.js'

class ProductServiceTest {
  purchaseProduct(productId, quantity, cartId) {
    const order = {
      productId,
      quantity,
    }

    RedisPubSubService.publish('purchase_event', JSON.stringify(order))
  }
}

export default new ProductServiceTest()
// import: import ProductServiceTest from './product.test.js'

// export const ProductServiceTest = new ProductServiceTest()
// Import: import { ProductServiceTest } from './product.test.js'
