import { KeyTokenService } from './keyToken.service'

const RoleShop = {
  SHOP: 'shop',
  WRITTER: 'writter',
  EDITOR: 'editor',
  ADMIN: 'admin',
}

class AcessService {
  static signUp = async ({ name, email, password }) => {
    try {
      const holderShop = await shopModel.findOne({ email }).lean()

      if (holderShop) {
        return {
          code: 'xxxx',
          message: 'Shop already registered',
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
        const { privateKey, publicKey } = await crypto.generateKeyPairSync('rsa', {
          modulesLength: 4096,
        })

        console.log({ privateKey, publicKey })
        const publicKeyString = KeyTokenService.createKeyToken({
          userId: newShop._id,
          publicKey,
        })

        if (!publicKeyString) {
          return {
            code: 'xxxx',
            message: 'Error generating public key',
            status: 'error',
          }
        }

        const tokens = await generateKeyPairSync(
          {
            userId: newShop._id,
            email,
            roles: newShop.role,
          },
          publicKeyString,
          privateKey
        )

        console.log({ tokens })

        return {
          code: HttpStatusCode.CREATED,
          metadata: {
            shop: newShop,
            tokens,
          },
        }
      }

      return {
        code: HttpStatusCode.INTERNAL_SERVER,
        message: 'Shop registration failed',
        metadata: null,
      }
    } catch (error) {
      return {
        code: 'xxxx',
        message: error.message || 'Internal server error',
        status: 'error',
      }
    }
  }
}

export { AcessService, RoleShop }
