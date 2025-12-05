const updateNestedObjectParse = (obj, parentKey = '', updateObj = {}) => {
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

const obj = {
  c: {
    d: 1,
    e: 2
  },
  f: 3
}

console.log('Input:', JSON.stringify(obj, null, 2))
console.log('Output:', JSON.stringify(updateNestedObjectParse(obj), null, 2))
