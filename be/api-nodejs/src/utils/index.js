import _ from 'lodash'
import mongoose from 'mongoose'

export const getInfoData = (field = [], object = {}) => {
  return _.pick(object, field)
}

export const getSelectData = (field = [], object = {}) => {
  return Object.fromEntries(field.map((f) => [f, 1]))
}

export const unGetSelectData = (field = [], object = {}) => {
  return Object.fromEntries(field.map((f) => [f, 0]))
}

export const removeUndefinedObject = (obj) => {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === undefined) {
      delete obj[key]
    }
  })
  return obj
}

// ex
// {
//   c: {
//     d: 1,
//     e: 2
//   },
//   f: 3

// }

// to
// c.d: 1
// c.e: 2
// f: 3

export const updateNestedObjectParse = (obj, parentKey = '', updateObj = {}) => {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  Object.keys(obj).forEach((key) => {
    const fullKey = parentKey ? `${parentKey}.${key}` : key
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key]) && obj[key] !== null) {
      updateNestedObjectParse(obj[key], fullKey, updateObj)
    } else {
      updateObj[fullKey] = obj[key]
    }
  })

  return updateObj
}

export const convertToObjectId = (id) => mongoose.Types.ObjectId(id)
