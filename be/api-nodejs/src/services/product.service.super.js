'use strict'

import { BadRequestError } from '#core/error.response.js'
import { ClothingModel, ElectronicsModel, FurnitureModel, ProductModel } from '#models/product.model.js'
import { PRODUCT_TYPES } from '#configs/product.config.js'
import { ProductRepo } from '#models/repository/product.repo.js'

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

  // creaate new Product
  async createProduct(product_id) {
    return await ProductModel.create({
      ...this,
      _id: product_id,
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
