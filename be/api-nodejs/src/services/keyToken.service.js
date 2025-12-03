import { KeyTokenModel, keyTokenSchema } from '#models/keytoken.model.js'
import { Types } from 'mongoose'

class KeyTokenService {
  static createKeyToken = async (userId, publicKey, privateKey, refreshToken = '') => {
    try {
      const publicKeyString = publicKey.toString()
      const privateKeyString = privateKey.toString()

      const filter = { user: userId },
        update = {
          publicKey: publicKeyString,
          privateKey: privateKeyString,
          refreshToken: refreshToken,
        },
        options = { upsert: true, new: true }

      // const tokens = await KeyTokenModel.create({
      //   user: userId,
      //   publicKey: publicKeyString,
      //   privateKey: privateKeyString,
      //   refreshToken: '',
      // })
      const tokens = await KeyTokenModel.findOneAndUpdate(filter, update, options)

      return tokens ? tokens.publicKey : null
    } catch (err) {
      console.error('Error creating key token:', err)
      return err
    }
  }

  static findByUserId = async (userId) => {
    return await KeyTokenModel.findOne({ user: new Types.ObjectId(userId) }).lean()
  }
  static removeKeyById = async (id) => {
    return await KeyTokenModel.findByIdAndDelete(id)
  }

  static findByRefreshTokenUsed = async (refreshToken) => {
    return await KeyTokenModel.findOne({ refreshTokenUsed: refreshToken }).lean()
  }

  static findByRefreshToken = async (refreshToken) => {
    return await KeyTokenModel.findOne({ refreshToken: refreshToken })
  }

  static deleteKeyById = async (userId) => {
    return await KeyTokenModel.deleteOne({ user: new Types.ObjectId(userId) })
  }
}

export { KeyTokenService }
