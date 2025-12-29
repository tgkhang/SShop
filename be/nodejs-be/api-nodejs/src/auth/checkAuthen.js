'use strict'

import { StatusCodes } from 'http-status-codes'
import { apiKeyService } from '#services/apikey.service.js'

const HEADER = {
  API_KEY: 'x-api-key',
  AUTHORIZATION: 'authorization',
}

export const apiKey = async (req, res, next) => {
  try {
    const key = req.headers[HEADER.API_KEY]?.toString()

    if (!key) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'API key is missing' })
    }

    const objKey = await apiKeyService.findById(key)

    if (!objKey) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid API key' })
    }

    // continue
    req.objKey = objKey
    next()
  } catch (error) {
    console.error('Error in API key authentication:', error)
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' })
  }
}

export const permission = (permission) => {
  return (req, res, next) => {
    if (!req.objKey.permissions?.includes(permission)) {
      return res.status(StatusCodes.FORBIDDEN).json({ message: 'Permission denied' })
    }
    next()
  }
}
