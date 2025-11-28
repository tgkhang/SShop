import { env } from '../configs/environment.js'

export const WHITELIST_DOMAINS = ['http://localhost:5173', 'https://trello-clone-gamma-lime.vercel.app']

export const BOARD_TYPES = {
  PUBLIC: 'public',
  PRIVATE: 'private',
}

export const FIELD_REQUIRED_MESSAGE = 'This field is required.'
export const EMAIL_RULE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i

export const EMAIL_RULE_MESSAGE = 'Please enter a valid email address.'
export const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
export const PASSWORD_RULE_MESSAGE =
  'Password must be at least 8 characters long and include uppercase, lowercase letters, and a number.'

export const LIMIT_COMMON_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
export const ALLOWED_COMMON_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg']

export const WEBSITE_DOMAIN =
  env.BUILD_MODE === 'production' ? env.WEBSITE_DOMAIN_PRODUCTION : env.WEBSITE_DOMAIN_DEVELOPMENT

export const DEFAULT_PAGE = 1
export const DEFAULT_ITEMS_PER_PAGE = 12 //need to match frontend constants

export const INVITATION_TYPES = {
  BOARD_INVITATION: 'BOARD_INVITATION',
}

export const BOARD_INVITATION_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
}

export const USER_ROLES = {
  ADMIN: 'admin',
  CLIENT: 'client',
}
