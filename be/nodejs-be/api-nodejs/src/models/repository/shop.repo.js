'use strict'

import { ShopModel } from '#models/shop.model.js'

const selectStruct = {
  email: 1,
  name: 1,
  status: 1,
  roles: 1,
}

const findShopById = async ({ shopId, select = selectStruct }) => {
  return await ShopModel.findById(shopId).select(select).lean().exec()
}

export const ShopRepo = {
  findShopById
}
