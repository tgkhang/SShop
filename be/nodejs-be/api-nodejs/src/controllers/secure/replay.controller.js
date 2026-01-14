'use strict'

import crypto from 'crypto'
import { env } from '#configs/environment.js'

const TIME_EXPIRATION = 300 // 5 minutes in seconds
const URL_SIGN_SECRET = env.URL_SIGN_SECRET || 'your-secret-key-change-this'

const MAN = [
  { name: 'cr7', age: 39 },
  { name: 'mbappe', age: 25 },
]
const TEAM2 = [
  { name: 'neymar', age: 31 },
  { name: 'messi', age: 36 },
]

// Helper function to generate signature
const generateSignature = (params, secretKey) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')
  return crypto.createHmac('sha256', secretKey).update(sortedParams).digest('hex')
}

class ReplayController {
  // Get server time
  getServerTime = async (req, res, next) => {
    return res.status(200).json({
      message: 'Server time retrieved',
      metadata: {
        timestamp: Math.floor(Date.now() / 1000),
        iso: new Date().toISOString(),
      },
    })
  }

  // Generate signed URL for testing
  generateSignedUrl = async (req, res, next) => {
    const { club } = req.query

    if (!club) {
      return res.status(400).json({
        message: 'Club parameter is required',
      })
    }

    const stime = Math.floor(Date.now() / 1000)
    const nonce = crypto.randomBytes(16).toString('hex')

    const params = {
      club,
      stime: stime.toString(),
      nonce,
    }

    const sign = generateSignature(params, URL_SIGN_SECRET)

    const baseUrl = `${req.protocol}://${req.get('host')}/v1/test/listPlayersByClub`
    const signedUrl = `${baseUrl}?club=${club}&stime=${stime}&nonce=${nonce}&sign=${sign}`

    return res.status(200).json({
      message: 'Signed URL generated successfully',
      metadata: {
        signedUrl,
        params: {
          club,
          stime,
          nonce,
          sign,
        },
        expiresIn: 300,
        expiresAt: new Date((stime + 300) * 1000).toISOString(),
        secretKey: URL_SIGN_SECRET,
      },
    })
  }

  // Verify signed URL and return players
  listPlayersByClub = async (req, res, next) => {
    const { club, stime, sign, nonce } = req.query

    // Validate required parameters
    if (!club || !stime || !sign || !nonce) {
      return res.status(400).json({
        message: 'Missing required fields',
      })
    }

    // Verify timestamp (check if request is within 5 minutes)
    const currentTime = Math.floor(Date.now() / 1000)
    const requestTime = parseInt(stime)
    const isTimeValid = currentTime - requestTime <= TIME_EXPIRATION

    if (!isTimeValid) {
      return res.status(400).json({
        message: 'Request expired',
      })
    }

    // Generate signature on server side using same parameters
    const params = {
      club,
      stime: stime.toString(),
      nonce,
    }
    const signServer = generateSignature(params, URL_SIGN_SECRET)

    // Verify signature matches
    if (sign !== signServer) {
      return res.status(400).json({
        // message: 'Invalid signature',
        // should not reveal too much info for security
        message: 'Invalid request',
      })
    }

    // TODO: Check nonce uniqueness using Redis to prevent replay attacks
    // const nonceKey = `nonce:${nonce}`
    // const exists = await redisClient.exists(nonceKey)
    // if (exists) return res.status(400).json({ message: 'Invalid request' })
    // await redisClient.setex(nonceKey, TIME_EXPIRATION, '1')

    // Return data if signature is valid
    const players = club.toLowerCase() === 'man' ? MAN : TEAM2

    return res.status(200).json({
      message: 'Request valid',
      metadata: {
        club,
        players,
      },
    })
  }
}

export default new ReplayController()
