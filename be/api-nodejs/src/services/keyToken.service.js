import { KeyTokenModel } from '../models/keytoken.model.js'

class KeyTokenService {
  static createKeyToken = async (userId, publicKey, privateKey) => {
    try {
      const publicKeyString = publicKey.toString()
      const privateKeyString = privateKey.toString()

      const tokens = await KeyTokenModel.create({
        user: userId,
        publicKey: publicKeyString,
        privateKey: privateKeyString,
        refreshToken: '',
      })

      return tokens ? tokens.publicKey : null
    } catch (err) {
      console.error('Error creating key token:', err)
      return err
    }
  }
}

export { KeyTokenService }