'use strict'

import { ProductModel } from '#models/product.model.js'

// general query product
const queryProducts = async ({ query, limit, skip }) => {
  return await ProductModel.find(query)
    .populate('product_shop', 'name email -_id')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
    .exec()
}

const findAllDraftsForShop = async ({ query, limit, skip }) => {
  return await queryProducts({ query, limit, skip })
}

const findAllPublishForShop = async ({ query, limit, skip }) => {
  return await queryProducts({ query, limit, skip })
}

const publishProductByShop = async ({ product_shop, product_id }) => {
  const { modifiedCount } = await ProductModel.updateOne(
    {
      product_shop,
      _id: product_id,
    },
    {
      $set: {
        isDraft: false,
        isPublished: true,
      },
    }
  )

  return modifiedCount
}

const unPublishProductByShop = async ({ product_shop, product_id }) => {
  const { modifiedCount } = await ProductModel.updateOne(
    {
      product_shop,
      _id: product_id,
    },
    {
      $set: {
        isDraft: true,
        isPublished: false,
      },
    }
  )

  return modifiedCount
}

// can use elastic search for better performance
const searchProductByUser = async ({ keySearch }) => {
  const results = await ProductModel.find(
    {
      isPublished: true,
      $text: { $search: keySearch },
    },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .select('product_name product_thumb product_description product_price product_slug')
    .lean()
    .exec()

  return results
}

// ctime means createdAt , newest first
const findAllProducts = async ({
  limit,
  sort = 'ctime',
  page = 1,
  filter = { isPublished: true },
  select = ['product_name', 'product_price', 'product_thumb', 'product_shop'],
}) => {
  const skip = (page - 1) * limit
  const sortBy = sort === 'ctime' ? { createdAt: -1 } : { product_price: sort === 'asc' ? 1 : -1 }

  const products = await ProductModel.find(filter)
    .sort(sortBy)
    .skip(skip)
    .limit(limit)
    .select(select.join(' '))
    .lean()
    .exec()

  return products
}

const findProduct = async ({ product_id, unSelect = [] }) => {
  return await ProductModel.findById(product_id)
    .select(unSelect.map((field) => `-${field}`).join(' '))
    .lean()
    .exec()
}

const updateProductById = async ({ productId, bodyUpdate, model, isNew = true }) => {
  return await model.findByIdAndUpdate(productId, bodyUpdate, { new: isNew })
}

export const ProductRepo = {
  findAllDraftsForShop,
  findAllPublishForShop,
  publishProductByShop,
  unPublishProductByShop,
  searchProductByUser,
  findAllProducts,
  findProduct,
  updateProductById,
}
