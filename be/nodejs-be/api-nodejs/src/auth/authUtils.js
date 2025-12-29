import { AuthFailureError, NotFoundError } from '#core/error.response.js'
import { asyncHandler } from '#helpers/asyncHandler.js'
import { KeyTokenService } from '#services/keyToken.service.js'
import jwt from 'jsonwebtoken'

const HEADER = {
  API_KEY: 'x-api-key',
  AUTHORIZATION: 'authorization',
  CLIENT_ID: 'x-client-id',
  REFRESH_TOKEN: 'x-rtoken-id',
}

export const createTokenPair = async (payload, publicKey, privateKey) => {
  try {
    // Using HS256 (HMAC) since we're using random hex strings, not RSA keys
    const accessToken = await jwt.sign(payload, privateKey, {
      algorithm: 'HS256',
      expiresIn: '2 days',
    })

    const refreshToken = await jwt.sign(payload, privateKey, {
      algorithm: 'HS256',
      expiresIn: '7 days',
    })

    return { accessToken, refreshToken }
  } catch (error) {
    throw error
  }
}

// Alternative implementation using RS256 (RSA) - requires proper RSA key pairs
// this version used when RSA keys are generated
// export const createTokenPair = async (payload, publicKey, privateKey) => {
//   try {
//     const accessToken = await jwt.sign(payload, privateKey, {
//       algorithm: 'RS256',
//       expiresIn: '2 days',
//     })

//     const refreshToken = await jwt.sign(payload, privateKey, {
//       algorithm: 'RS256',
//       expiresIn: '7 days',
//     })

//     return { accessToken, refreshToken }
//   } catch (error) {
//     throw error}
// }

export const authentication = asyncHandler(async (req, res, next) => {
  // 1 check userid missing
  // 2 get accesstoken
  // 3 verify token
  // 4 check user in dbs
  // 5 check keyStore with user id

  const userId = req.headers[HEADER.CLIENT_ID]
  if (!userId) throw new AuthFailureError('Invalid request!')

  const keyStore = await KeyTokenService.findByUserId(userId)
  if (!keyStore) throw new NotFoundError('Not found keyStore')

  // Handle refresh token endpoint - get token from body
  if (req.body.refreshToken) {
    req.refreshToken = req.body.refreshToken
    req.keyStore = keyStore
    return next()
  }

  // Verify access token for other endpoints
  const accessToken = req.headers[HEADER.AUTHORIZATION]
  if (!accessToken) throw new AuthFailureError('Invalid request!')

  try {
    const decoded = jwt.verify(accessToken, keyStore.privateKey)
    if (userId !== decoded.userId) {
      throw new AuthFailureError('Invalid user!')
    }
    req.keyStore = keyStore
    req.user = decoded

    next()
  } catch (error) {
    throw error
  }
})

export const authenticationV2 = asyncHandler(async (req, res, next) => {
  // 1 check userid missing
  // 2 get accesstoken
  // 3 verify token
  // 4 check user in dbs
  // 5 check keyStore with user id

  const userId = req.headers[HEADER.CLIENT_ID]
  if (!userId) throw new AuthFailureError('Invalid request!')

  const keyStore = await KeyTokenService.findByUserId(userId)
  if (!keyStore) throw new NotFoundError('Not found keyStore')

  // V2: Handle refresh token endpoint - get token from header instead of body
  if (req.headers[HEADER.REFRESH_TOKEN]) {
    try {
      const refreshToken = req.headers[HEADER.REFRESH_TOKEN]
      const decoded = await jwt.verify(refreshToken, keyStore.privateKey)
      if (userId !== decoded.userId) {
        throw new AuthFailureError('Invalid user!')
      }
      req.refreshToken = refreshToken
      req.keyStore = keyStore
      req.user = decoded
      return next()
    } catch (error) {
      throw error
    }
  }

  // Verify access token for other endpoints
  const accessToken = req.headers[HEADER.AUTHORIZATION]
  if (!accessToken) throw new AuthFailureError('Invalid request!')

  try {
    const decoded = jwt.verify(accessToken, keyStore.privateKey)
    if (userId !== decoded.userId) {
      throw new AuthFailureError('Invalid user!')
    }
    req.keyStore = keyStore
    req.user = decoded

    next()
  } catch (error) {
    throw error
  }
})

export const verifyToken = async (token, keySecret) => {
  return await jwt.verify(token, keySecret)
}
