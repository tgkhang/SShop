import { RoleModel } from '#models/role.model.js'

const createRole = async ({ name, slug, description, grants }) => {
  // 2 create new role
  const newRole = await RoleModel.create({
    rol_name: name,
    rol_slug: slug,
    rol_description: description,
    rol_grants: grants,
  })
  return newRole
}

const getRoleByNameOrSlug = async ({ name, slug }) => {
  const role = await RoleModel.findOne({
    $or: [
      { rol_name: name },
      { rol_slug: slug },
    ],
  })
  return role
}

const getRoleList = async ({ limit = 20, offset = 0, search = '' }) => {
  const filter = search ? {
    $or: [
      { rol_name: { $regex: search, $options: 'i' } },
      { rol_slug: { $regex: search, $options: 'i' } },
      { rol_description: { $regex: search, $options: 'i' } },
    ],
  } : {}

  const roles = await RoleModel.find(filter)
    .skip(offset)
    .limit(limit)
    .select('rol_name rol_slug rol_description rol_status createdAt')
    .lean()

  return roles
}

export const RoleRepo = {
  createRole,
  getRoleByNameOrSlug,
  getRoleList,
}
