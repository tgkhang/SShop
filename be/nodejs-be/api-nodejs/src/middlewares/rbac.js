import { AuthFailureError } from '#core/error.response.js'
import ac from './role.middleware.js'

const grantAccess = (action, resource) => {
  return async (req, res, next) => {
    try {
      // const rol_name = req.user.rol_name
      const rol_name = 'admin' // Mock role for testing
      const permission = ac.can(rol_name)[action](resource)
      if (!permission.granted) {
        throw new AuthFailureError('You do not have permission to perform this action')
      }
      next()
    } catch (error) {
      next(error)
    }
  }
}

export { grantAccess }
