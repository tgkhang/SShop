'use strict'

import { BadRequestError } from '#core/error.response.js'
import { ClothingModel, ElectronicsModel, FurnitureModel, ProductModel } from '#models/product.model.js'
import { PRODUCT_TYPES } from '#configs/product.config.js'
import { ProductRepo } from '#models/repository/product.repo.js'
import { removeUndefinedObject, updateNestedObjectParse } from '#utils/index.js'
import { InventoryRepo } from '#models/repository/inventory.repo.js'
import { NotificationService } from '#services/notification.service.js'
import { NOTIFICATION_TYPES } from '#configs/notification.config.js'

//define factory class to create product
class ProductFactory {
  static productRegistry = {}

  static registerProductType(type, classRef) {
    ProductFactory.productRegistry[type] = classRef
  }

  static async createProduct(type, payload) {
    const productClass = ProductFactory.productRegistry[type]
    if (productClass) {
      return new productClass(payload).createProduct()
    } else {
      throw new BadRequestError(`Invalid product type: ${type}`)
    }
  }

  // query
  static async findAllDraftsForShop({ product_shop, limit = 50, skip = 0 }) {
    const query = { product_shop, isDraft: true }
    return await ProductRepo.findAllDraftsForShop({ query, limit, skip })
  }

  static async findAllPublishForShop({ product_shop, limit = 50, skip = 0 }) {
    const query = { product_shop, isPublished: true }
    return await ProductRepo.findAllPublishForShop({ query, limit, skip })
  }

  static async searchProductByUser({ keySearch }) {
    return await ProductRepo.searchProductByUser({ keySearch })
  }

  static async findAllProducts({ limit = 50, sort = 'ctime', page = 1, filter = { isPublished: true } }) {
    return await ProductRepo.findAllProducts({
      limit,
      sort,
      page,
      filter,
      select: ['product_name', 'product_price', 'product_thumb'],
    })
  }

  static async findProduct({ product_id }) {
    return await ProductRepo.findProduct({
      product_id,
      unSelect: ['__v'],
    })
  }

  // put
  static async publishProductByShop({ product_shop, product_id }) {
    return await ProductRepo.publishProductByShop({ product_shop, product_id })
  }

  static async unPublishProductByShop({ product_shop, product_id }) {
    return await ProductRepo.unPublishProductByShop({ product_shop, product_id })
  }

  static async updateProduct({ type, productId, payload }) {
    const productClass = ProductFactory.productRegistry[type]
    if (!productClass) throw new BadRequestError(`Invalid product type: ${type}`)
    return new productClass(payload).updateProduct(productId)
  }
  // end query
}

//defind base product cclass
class Product {
  constructor({
    product_name,
    product_thumb,
    product_description,
    product_price,
    product_quantity,
    product_type,
    product_shop,
    product_attributes,
  }) {
    this.product_name = product_name
    this.product_thumb = product_thumb
    this.product_description = product_description
    this.product_price = product_price
    this.product_quantity = product_quantity
    this.product_type = product_type
    this.product_shop = product_shop
    this.product_attributes = product_attributes
  }

  // create new Product
  async createProduct(product_id) {
    const newProduct = await ProductModel.create({
      ...this,
      _id: product_id,
    })

    if (newProduct) {
      // Insert inventory
      await InventoryRepo.insertInventory({
        productId: newProduct._id,
        shopId: this.product_shop,
        stock: this.product_quantity,
      })

      // Push notification to system
      // MICRO-SERVICE / MESSAGE QUEUE CAN BE IMPLEMENTED HERE
      // ANOTHER SYSTEM WILL HANDLE NOTIFICATION DELIVERY
      await NotificationService.pushNotificationToSystem({
        type: NOTIFICATION_TYPES.SHOP_NEW_PRODUCT,
        receiverId: null, // Will use mock receiver in service
        senderId: this.product_shop, // The shop creating the product
        options: {
          product_name: this.product_name,
          product_id: newProduct._id,
          shop_name: this.product_shop,
        },
      })
    }

    return newProduct
  }

  async updateProduct(productId, bodyUpdate) {
    return await ProductRepo.updateProductById({
      productId,
      bodyUpdate,
      model: ProductModel,
    })
  }
}

//define subclass for differeent type of clothing
class Clothing extends Product {
  async createProduct() {
    const newClothing = await ClothingModel.create({
      ...this.product_attributes,
      product_shop: this.product_shop,
    })
    if (!newClothing) throw new BadRequestError('Create new clothing error')

    const newProduct = await super.createProduct(newClothing._id)
    if (!newProduct) throw new BadRequestError('Create new product error')

    return newProduct
  }

  async updateProduct(productId) {
    //1 remove null/undefined fields from product_attributes
    //2 check where to update
    //3

    const objectParams = removeUndefinedObject(this)

    console.log('objectParams', objectParams)
    if (objectParams.product_attributes) {
      //update child (clothes collection)
      await ProductRepo.updateProductById({
        productId,
        bodyUpdate: updateNestedObjectParse(objectParams.product_attributes),
        model: ClothingModel,
      })
      // Keep product_attributes to update main product collection too
    }

    const updateProduct = await super.updateProduct(productId, updateNestedObjectParse(objectParams))
    return updateProduct
  }
}

class Electronics extends Product {
  async createProduct() {
    const newElectronics = await ElectronicsModel.create({
      ...this.product_attributes,
      product_shop: this.product_shop,
    })
    if (!newElectronics) throw new BadRequestError('Create new electronics error')

    const newProduct = await super.createProduct(newElectronics._id)
    if (!newProduct) throw new BadRequestError('Create new product error')

    return newProduct
  }

  async updateProduct(productId) {
    const objectParams = removeUndefinedObject(this)

    if (objectParams.product_attributes) {
      // Update child (electronics collection)
      await ProductRepo.updateProductById({
        productId,
        bodyUpdate: updateNestedObjectParse(objectParams.product_attributes),
        model: ElectronicsModel,
      })
    }

    const updateProduct = await super.updateProduct(productId, updateNestedObjectParse(objectParams))
    return updateProduct
  }
}

class Furniture extends Product {
  async createProduct() {
    const newFurniture = await FurnitureModel.create({
      ...this.product_attributes,
      product_shop: this.product_shop,
    })
    if (!newFurniture) throw new BadRequestError('Create new furniture error')

    const newProduct = await super.createProduct(newFurniture._id)
    if (!newProduct) throw new BadRequestError('Create new product error')

    return newProduct
  }

  async updateProduct(productId) {
    const objectParams = removeUndefinedObject(this)

    if (objectParams.product_attributes) {
      // Update child (furniture collection)
      await ProductRepo.updateProductById({
        productId,
        bodyUpdate: updateNestedObjectParse(objectParams.product_attributes),
        model: FurnitureModel,
      })
    }

    const updateProduct = await super.updateProduct(productId, updateNestedObjectParse(objectParams))
    return updateProduct
  }
}

// ProductService extends ProductFactory to inherit all its methods
// This eliminates the need to manually declare every method in both classes
class ProductService extends ProductFactory {
  // You can override or add new methods here if needed
  // All ProductFactory methods are automatically available
}

// Product type to class mapping
const PRODUCT_CLASS_MAP = {
  Clothing,
  Electronics,
  Furniture,
}

// Auto-register all product types from config
PRODUCT_TYPES.forEach((type) => {
  const productClass = PRODUCT_CLASS_MAP[type]
  if (productClass) {
    ProductFactory.registerProductType(type, productClass)
  }
})

export { ProductService }
