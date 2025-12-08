import { CartModel } from '#models/cart.model.js'

const createUserCart = async ({ userId, product }) => {
  const query = {
    cart_userId: userId,
    cart_state: 'active',
  }

  const updateOrInsert = {
    $addToSet: {
      cart_products: product,
    },
  }
  const options = { upsert: true, new: true }

  return await CartModel.findOneAndUpdate(query, updateOrInsert, options).lean().exec()
}

const updateUserCartQuantity = async ({ userId, product }) => {
  const { productId, quantity } = product
  const query = {
    cart_userId: userId,
    cart_state: 'active',
    'cart_products.productId': productId,
  }
  const updateSet = {
    $inc: {
      'cart_products.$.quantity': quantity,
    },
  }
  const options = { upsert: true, new: true }

  const updatedCart = await CartModel.findOneAndUpdate(query, updateSet, options).lean().exec()
  return updatedCart
}

const deleteCartItem = async ({ userId, productId }) => {
  const query = { cart_userId: userId, cart_state: 'active' }

  const updateSet = {
    $pull: {
      cart_products: { productId },
    },
  }
  const options = { new: true }

  const updatedCart = await CartModel.findOneAndUpdate(query, updateSet, options).lean().exec()
  return updatedCart
}

const findUserCart = async ({ userId }) => {
  return await CartModel.findOne({ cart_userId: userId, cart_state: 'active' }).lean().exec()
}

const deleteUserCart = async ({ userId }) => {
  const query = { cart_userId: userId, cart_state: 'active' }
  return await CartModel.findOneAndDelete(query).lean().exec()
}

const findCartById = async ({ cartId }) => {
  return await CartModel.findById(cartId).lean().exec()
}

const findActiveCartById = async ({ cartId }) => {
  return await CartModel.findOne({ _id: cartId, cart_state: 'active' }).lean().exec()
}

export const CartRepo = {
  createUserCart,
  updateUserCartQuantity,
  deleteCartItem,
  findUserCart,
  deleteUserCart,
  findCartById,
  findActiveCartById,
}
