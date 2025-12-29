import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { StatusCodes } from 'http-status-codes'
import jwt from 'jsonwebtoken'
import { ShopModel } from '#models/shop.model.js'
import { createTokenPair, verifyToken } from '#auth/authUtils.js'
import { KeyTokenService } from '#services/keyToken.service.js'
import { getInfoData } from '#utils/formatters.js'
import { AuthFailureError, BadRequestError, ForbiddenError } from '#core/error.response.js'
import { ShopService } from './shop.service.js'

const RoleShop = {
  SHOP: 'shop',
  WRITTER: 'writter',
  EDITOR: 'editor',
  ADMIN: 'admin',
}

class AccessService {
  // 1. check email exist
  // 2. match password
  // 3. create AT, RT
  // 4. generat token (?)
  // 5. get data shop return
  static login = async ({ email, password, refreshToken = null }) => {
    const shop = await ShopService.findByEmail({ email })
    if (!shop) {
      throw new BadRequestError('Shop not registered')
    }

    //2
    const match = await bcrypt.compare(password, shop.password)
    if (!match) {
      throw new AuthFailureError('Password is incorrect')
    }

    //3
    const privateKey = crypto.randomBytes(64).toString('hex')
    const publicKey = crypto.randomBytes(64).toString('hex')
    const token = await createTokenPair({ userId: shop._id, email }, publicKey, privateKey)

    await KeyTokenService.createKeyToken(shop._id, publicKey, privateKey, token.refreshToken)

    return {
      shop: getInfoData(['_id', 'name', 'email'], shop),
      tokens: token,
    }
  }

  static signUp = async ({ name, email, password }) => {
    const holderShop = await ShopModel.findOne({ email }).lean()

    if (holderShop) {
      // return {
      //   code: StatusCodes.BAD_REQUEST,
      //   message: 'Shop email has already been registered',
      // }
      throw new BadRequestError('Shop email has already been registered')
    }
    const passwordHash = await bcrypt.hash(password, 10)

    const newShop = await ShopModel.create({
      name,
      email,
      password: passwordHash,
      role: [RoleShop.SHOP],
    })

    if (newShop) {
      // const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      //   modulusLength: 4096,
      //   publicKeyEncoding: {
      //     type: 'pkcs1',
      //     format: 'pem',
      //   },
      //   privateKeyEncoding: {
      //     type: 'pkcs1',
      //     format: 'pem',
      //   },
      // })

      //simple version
      const privateKey = crypto.randomBytes(64).toString('hex')
      const publicKey = crypto.randomBytes(64).toString('hex')

      console.log({ privateKey, publicKey })
      const publicKeyString = await KeyTokenService.createKeyToken(newShop._id, publicKey, privateKey)

      if (!publicKeyString) {
        throw new BadRequestError('Key token error')
      }

      const tokens = await createTokenPair(
        {
          userId: newShop._id,
          email,
          roles: newShop.role,
        },
        publicKey,
        privateKey
      )

      console.log('=== TOKENS GENERATED ===')
      console.log({ tokens })
      console.log('\n=== DECODED ACCESS TOKEN ===')
      console.log(jwt.decode(tokens.accessToken))
      console.log('\n=== DECODED REFRESH TOKEN ===')
      console.log(jwt.decode(tokens.refreshToken))
      console.log('========================\n')

      return {
        code: StatusCodes.CREATED,
        metadata: {
          shop: getInfoData(['_id', 'name', 'email', 'role', 'createdAt', 'updatedAt'], newShop),
          tokens,
        },
      }
    }

    return {
      code: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'Shop registration failed',
      metadata: null,
    }
  }

  static logout = async ({ keyStore }) => {
    const delKey = await KeyTokenService.removeKeyById(keyStore._id)
    console.log('Deleted key:', delKey)
    return {
      acknowledged: true,
      deletedCount: delKey ? 1 : 0,
    }
  }

  static handlerRefreshToken = async ({ refreshToken, user, keyStore }) => {
    // V2: Token already verified in middleware, user and keyStore are provided
    // Check if this refresh token was already used (security check)
    const foundToken = await KeyTokenService.findByRefreshTokenUsed(refreshToken)

    if (foundToken) {
      // Token reuse detected - possible attack
      const { userId, email } = user

      console.log('[SECURITY] Refresh token reuse detected:', { userId, email })

      // Delete all tokens for this user (force re-login)
      await KeyTokenService.removeKeyById(userId)
      throw new ForbiddenError('Something went wrong! Please login again')
    }

    // Get the keyToken document (not lean) so we can call updateOne on it
    const holderToken = await KeyTokenService.findByRefreshToken(refreshToken)

    if (!holderToken) throw new AuthFailureError('Invalid refresh token')

    // Get user info from decoded token (already verified in middleware)
    const { userId, email } = user

    // Check if user still exists
    const foundShop = await ShopService.findById(userId)

    if (!foundShop) throw new AuthFailureError('Shop not registered')

    // Create new token pair using the keyStore from middleware
    const tokens = await createTokenPair({ userId, email }, keyStore.publicKey, keyStore.privateKey)

    // Update token in database: set new refresh token and mark old one as used
    // Use holderToken (Mongoose document) not keyStore (plain object)
    const updateResult = await holderToken.updateOne({
      $set: { refreshToken: tokens.refreshToken },
      $addToSet: { refreshTokenUsed: refreshToken },
    })

    console.log('Token refresh successful:', { userId, updateResult })

    return {
      shop: getInfoData(['_id', 'name', 'email'], foundShop),
      tokens,
    }
  }

  static handlerRefreshTokenV1 = async ({ refreshToken }) => {
    // check token are used
    const foundToken = await KeyTokenService.findByRefreshTokenUsed(refreshToken)

    // found == cute
    if (foundToken) {
      // who are you?
      const { userId, email } = await verifyToken(refreshToken, foundToken.privateKey)

      console.log({ userId, email })

      // delete all token in db
      await KeyTokenService.removeKeyById(userId)
      throw new ForbiddenError('Something went wrong! Please login again')
    }

    const holderToken = await KeyTokenService.findByRefreshToken(refreshToken)

    if (!holderToken) throw new AuthFailureError('Shop not registered')

    // verify token
    const { userId, email } = await verifyToken(refreshToken, holderToken.privateKey)

    // check userId
    const foundShop = await ShopService.findById(userId)

    if (!foundShop) throw new AuthFailureError('Shop not registered')

    // create new token
    const tokens = await createTokenPair({ userId, email }, holderToken.publicKey, holderToken.privateKey)

    // update token
    const updateResult = await holderToken.updateOne({
      $set: { refreshToken: tokens.refreshToken },
      $addToSet: { refreshTokenUsed: refreshToken },
    })

    console.log('Update result:', updateResult)

    return {
      shop: getInfoData(['_id', 'name', 'email'], foundShop),
      tokens,
    }
  }
}

export { AccessService, RoleShop }
