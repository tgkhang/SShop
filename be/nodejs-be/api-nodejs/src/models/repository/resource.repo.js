import { ResourceModel } from '#models/resource.model.js'

const createResource = async ({ name, slug, description }) => {
  const newResource = await ResourceModel.create({
    src_name: name,
    src_slug: slug,
    src_description: description,
  })
  return newResource
}

const getResourceByNameOrSlug = async ({ name, slug }) => {
  const resource = await ResourceModel.findOne({
    $or: [
      { src_name: name },
      { src_slug: slug },
    ],
  })
  return resource
}

const getResourceList = async ({ limit = 20, offset = 0, search = '' }) => {
  const filter = search ? {
    $or: [
      { src_name: { $regex: search, $options: 'i' } },
      { src_slug: { $regex: search, $options: 'i' } },
      { src_description: { $regex: search, $options: 'i' } },
    ],
  } : {}

  const resources = await ResourceModel.find(filter)
    .skip(offset)
    .limit(limit)
    .select('src_name src_slug src_description createdAt')
    .lean()

  return resources.map(resource => ({
    resourceId: resource._id,
    src_name: resource.src_name,
    src_slug: resource.src_slug,
    src_description: resource.src_description,
    createdAt: resource.createdAt,
  }))
}

export const ResourceRepo = {
  createResource,
  getResourceByNameOrSlug,
  getResourceList,
}
