'use strict'

import { Schema } from 'mongoose'

const DOCUMENT_NAME = 'Role'
const COLLECTION_NAME = 'Roles'

/*
example of rol_grants:
const grantList = [
  {
    role: 'admin',
    resource: 'profile',
    actions: 'update:any',
    attributes: '*',
  },
  {
    role: 'admin',
    resource: 'balance',
    actions: 'update:any',
    attributes: '*, !mount',
  },
  {
    role: 'shop',
    resource: 'profile',
    actions: 'update:own',
    attributes: '*',
  },
]
*/

const roleSchema = new Schema(
  {
    rol_name: { type: String, default: 'user', enum: ['admin', 'user', 'shop'] },
    rol_slug: { type: String, required: true },
    rol_status: { type: String, default: 'active', enum: ['active', 'inactive', 'pending'] },
    rol_description: { type: String, default: '' },
    rol_grants: [
      {
        resource: { type: Schema.Types.ObjectId, ref: 'Resource', required: true },
        actions: [{ type: String, required: true }], // e.g., ['create', 'read', 'update', 'delete']
        attributes: [{ type: String, default: '*' }], // e.g., ['*'] for all attributes or specific attributes like ['name', 'email']
      },
    ],
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
)

export { roleSchema, DOCUMENT_NAME, COLLECTION_NAME }
