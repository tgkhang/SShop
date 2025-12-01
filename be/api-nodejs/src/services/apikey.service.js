'use strict'

import apiKeyModel from '#models/apiKey.model.js'

const findById = async (key) => {
  const objKey = await apiKeyModel.findOne({ key: key, status: true }).lean()
  return objKey
}

export const apiKeyService = {
  findById,
}
