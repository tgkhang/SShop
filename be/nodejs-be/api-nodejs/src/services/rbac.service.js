'use strict'

import { ResourceRepo } from '#models/repository/resource.repo.js'
import { RoleRepo } from '#models/repository/role.repo.js'

class RBACService {
  createResource = async ({ name = '', slug = '', description = '' }) => {
    try {
      // 1 check name or slug exist
      const existingResource = await ResourceRepo.getResourceByNameOrSlug({ name, slug })
      if (existingResource) {
        throw new Error(`Resource with name '${name}' or slug '${slug}' already exists`)
      }
      // 2 create new resource
      const newResource = await ResourceRepo.createResource({ name, slug, description })
      return newResource
    } catch (error) {
      throw error
    }
  }

  resourceList = async ({ userId, limit = 20, offset = 0, search = '' }) => {
    try {
      // 1 check for admin middleware

      // 2 get list of resouce
      const resources = await ResourceRepo.getResourceList({ limit, offset, search })
      return resources
    } catch (error) {}
  }

  createRole = async ({ name = 'shop', slug = '', description = '', grants = [] }) => {
    try {
      // 1 check role exist
      const existingRole = await RoleRepo.getRoleByNameOrSlug({ name, slug })
      if (existingRole) {
        throw new Error(`Role with name '${name}' or slug '${slug}' already exists`)
      }
      // 2 create new role
      const newRole = await RoleRepo.createRole({ name, slug, description, grants })
      return newRole
    } catch (error) {
      throw error
    }
  }

  roleList = async ({ userId, limit = 20, offset = 0, search = '' }) => {
    try {
      // 1 check for admin middleware
      // 2 get list of roles
      const roles = await RoleRepo.getRoleList({ limit, offset, search })
      return roles
    } catch (error) {
      throw error
    }
  }
}

export default new RBACService()
