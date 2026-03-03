'use strict'

class RBACService {
  createResource = async ({ name = '', slug = '', description = '' }) => {
    try {
      // 1 check name or slug exist
      // 2 create new resource
      const newResource = await ResourceRepo.createResource({ name, slug, description })
      return newResource
    } catch (error) {}
  }

  resourceList = async () => {
    try {
    } catch (error) {}
  }

  createRole = async () => {
    try {
    } catch (error) {}
  }

  roleList = async () => {
    try {
    } catch (error) {}
  }
}

export default new RBACService()
