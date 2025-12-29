'use strict'

import { BadRequestError } from '#core/error.response.js'
import { ClothingModel, ElectronicsModel, ProductModel } from '#models/product.model.js'

//define factory class to create product
class ProductFactory {
  static async createProduct(type, payload) {
    switch (type) {
      case 'Clothing':
        return new Clothing(payload).createProduct()
      case 'Electronics':
        return new Electronics(payload).createProduct()
      default:
        throw new BadRequestError(`Invalid product type: ${type}`)
    }
  }
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

class ProductService {
  static createProduct = async (type, payload) => {
    return await ProductFactory.createProduct(type, payload)
  }
}

export { ProductService }
