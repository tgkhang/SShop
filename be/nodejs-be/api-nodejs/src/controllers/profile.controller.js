'use strict'

import { SuccessResponse } from "#core/success.response.js"

//mock data for profile
const dataProfiles = [
  {
    usr_id: 1,
    usr_name: 'John Doe',
    usr_avatar: 'https://example.com/avatar1.jpg',
  },
  {
    usr_id: 2,
    usr_name: 'Jane Smith',
    usr_avatar: 'https://example.com/avatar2.jpg',
  },
  {
    usr_id: 3,
    usr_name: 'Alice Johnson',
    usr_avatar: 'https://example.com/avatar3.jpg',
  },
]

class ProfileController {
  // Admin: View all profiles
  getAllProfiles = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get all profiles successfully!',
      metadata: dataProfiles,
    }).send(res)
  }
  // Shop: View own profile
  getOwnProfile = async (req, res, next) => {
    // const userId = req.user.userId
    const userId = 1 // Mock user ID for testing
    const profile = dataProfiles.find((p) => p.usr_id === userId)
    new SuccessResponse({
      message: 'Get own profile successfully!',
      metadata: profile,
    }).send(res)
  }
}

export default new ProfileController()
