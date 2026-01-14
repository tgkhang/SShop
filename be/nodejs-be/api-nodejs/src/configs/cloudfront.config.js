'use strict'

import { getSignedUrl } from '@aws-sdk/cloudfront-signer'
import { env } from './environment.js'
import fs from 'fs'
import path from 'path'

export function getSignedCloudFrontUrl(resourceKey, expiresIn = 3600) {
  const url = `https://${env.AWS_CLOUDFRONT_DOMAIN}/${resourceKey}`

  // Read private key from file system
  const privateKey = fs.readFileSync(path.join(process.cwd(), env.AWS_CLOUDFRONT_PRIVATE_KEY_PATH), 'utf8')

  // Calculate expiration date
  const dateLessThan = new Date(Date.now() + expiresIn * 1000).toISOString()

  // Generate signed URL
  const signedUrl = getSignedUrl({
    url,
    keyPairId: env.AWS_CLOUDFRONT_KEY_PAIR_ID,
    privateKey,
    dateLessThan,
  })

  return signedUrl
}
