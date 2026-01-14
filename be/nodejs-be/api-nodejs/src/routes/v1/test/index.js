import express from 'express'
import replayController from '#controllers/secure/replay.controller.js'

const router = express.Router()

// Get server time
router.get('/server-time', replayController.getServerTime)

// Generate signed URL for testing
router.get('/generate-signed-url', replayController.generateSignedUrl)

// Test route for signed URL verification
router.get('/listPlayersByClub', replayController.listPlayersByClub)

export const testRouter = router
