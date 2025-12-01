import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import { shopSchema, DOCUMENT_NAME as ShopDocumentName } from '../models/shop.model.js'
import { createTokenPair } from '../auth/authUtils.js'
import { KeyTokenService } from './keyToken.service.js'
import { getInfoData } from '../utils/formatters.js'

const shopModel = mongoose.model(ShopDocumentName, shopSchema)

const RoleShop = {
  SHOP: 'shop',
  WRITTER: 'writter',
  EDITOR: 'editor',
  ADMIN: 'admin',
}

class AccessService {
  static signUp = async ({ name, email, password }) => {
    try {
      const holderShop = await shopModel.findOne({ email }).lean()

      if (holderShop) {
        return {
          code: StatusCodes.BAD_REQUEST,
          message: 'Shop email has already been registered',
        }
      }
      const passwordHash = await bcrypt.hash(password, 10)

      const newShop = await shopModel.create({
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

        //simpl
        const privateKey = crypto.randomBytes(64).toString('hex')
        const publicKey = crypto.randomBytes(64).toString('hex')

        console.log({ privateKey, publicKey })
        const publicKeyString = await KeyTokenService.createKeyToken(newShop._id, publicKey, privateKey)

        if (!publicKeyString) {
          return {
            code: StatusCodes.INTERNAL_SERVER_ERROR,
            message: 'Error generating public key',
            status: 'error',
          }
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
    } catch (error) {
      return {
        code: StatusCodes.INTERNAL_SERVER_ERROR,
        message: error.message || 'Internal server error',
        status: 'error',
      }
    }
  }
}

export { AccessService, RoleShop }
