import ProductServiceTest from './product.test.js'
import './inventory.test.js'

console.log('Testing product purchase...')
ProductServiceTest.purchaseProduct('product:001', 10)

// Keep process alive to receive messages
setTimeout(() => {
  console.log('Test completed.')
  process.exit(0)
}, 2000)
