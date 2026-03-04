'use strict'

import { SuccessResponse } from '#core/success.response.js'
import rbacService from '#services/rbac.service.js'

// you can use class or just function
// use class when we need to inherit

const createRole = async (req, res, next) => {
  new SuccessResponse({
    message: 'Create role successfully!',
    metadata: await rbacService.createRole(req.body),
  }).send(res)
}

const createResource = async (req, res, next) => {
  new SuccessResponse({
    message: 'Create resource successfully!',
    metadata: await rbacService.createResource(req.body),
  }).send(res)
}

const listRole = async (req, res, next) => {
  new SuccessResponse({
    message: 'Get list role successfully!',
    metadata: await rbacService.roleList(req.query),
  }).send(res)
}

const listResource = async (req, res, next) => {
  new SuccessResponse({
    message: 'Get list resource successfully!',
    metadata: await rbacService.resourceList(req.query),
  }).send(res)
}

export const RBACController = {
  createRole,
  createResource,
  listRole,
  listResource,
}
