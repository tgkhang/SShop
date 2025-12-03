'use strict'

import { ShopModel } from '#models/shop.model.js'

const findByEmail = async ({ email, select = { email: 1, password: 1, name: 1, status: 1 } }) => {
  return await ShopModel.findOne({ email }).select(select).lean()
}

const findById = async (id) => {
  return await ShopModel.findById(id).lean()
}

export const ShopService = {
  findByEmail,
  findById,
}
