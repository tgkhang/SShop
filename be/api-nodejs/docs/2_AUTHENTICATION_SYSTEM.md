# Authentication System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Public Key vs Private Key](#public-key-vs-private-key)
3. [Simple Version vs Hard Version](#simple-version-vs-hard-version)
4. [Key Lifecycle](#key-lifecycle)
5. [Two-Layer Security](#two-layer-security)
6. [Future Use Cases for Public Key](#future-use-cases-for-public-key)
7. [API Reference](#api-reference)

---

## Overview

This application uses a **two-layer security model**:
1. **API Key** - Partner/Client identification and access control
2. **JWT Tokens** - User authentication and authorization

---

## Public Key vs Private Key

### Current Implementation (Simple Version - HS256)

```javascript
// Generate random keys (access.service.js:41-42)
const privateKey = crypto.randomBytes(64).toString('hex')  // 128 characters
const publicKey = crypto.randomBytes(64).toString('hex')   // 128 characters
```

### What They Do:

| Key | Purpose | Current Use | Storage |
|-----|---------|-------------|---------|
| **Private Key** | Sign and verify JWT tokens | ✅ Active - Used for HMAC-SHA256 signing | MongoDB `Keys` collection |
| **Public Key** | (Reserved for future) | ⚠️ Currently unused | MongoDB `Keys` collection |

### Why Store Public Key If Not Used?

The public key is stored for **future migration** to asymmetric cryptography (RSA). Currently it's generated but not utilized in the HS256 algorithm.

---

## Simple Version vs Hard Version

### 🔹 Simple Version (CURRENT - HS256)

**File:** `access.service.js:91-92`

```javascript
// Symmetric encryption - Same key for signing and verifying
const privateKey = crypto.randomBytes(64).toString('hex')
const publicKey = crypto.randomBytes(64).toString('hex')

// Sign tokens with HS256 (authUtils.js:6-14)
const accessToken = jwt.sign(payload, privateKey, {
  algorithm: 'HS256',  // HMAC with SHA-256
  expiresIn: '2 days'
})
```

**Characteristics:**
- ✅ **Faster** - HMAC operations are computationally cheaper
- ✅ **Simpler** - Single key for both signing and verification
- ✅ **Smaller keys** - 128 character hex string (~512 bits)
- ⚠️ **Security concern** - Private key must be kept secret (if leaked, attacker can create valid tokens)
- ⚠️ **Not distributable** - Cannot share verification key with third parties

**Use case:** Single server authentication, internal microservices

---

### 🔹 Hard Version (COMMENTED - RS256)

**File:** `access.service.js:73-88` (currently commented out)

```javascript
// Asymmetric encryption - Different keys for signing and verifying
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 4096,           // Key size: 4096 bits (very secure)
  publicKeyEncoding: {
    type: 'pkcs1',               // Public-Key Cryptography Standards #1
    format: 'pem',               // Privacy Enhanced Mail format
  },
  privateKeyEncoding: {
    type: 'pkcs1',
    format: 'pem',
  },
})

// Sign tokens with RS256
const accessToken = jwt.sign(payload, privateKey, {
  algorithm: 'RS256',  // RSA with SHA-256
  expiresIn: '2 days'
})
```

**Example RSA Keys:**

**Private Key (PEM format):**
```
-----BEGIN RSA PRIVATE KEY-----
MIIJKAIBAAKCAgEAu5Z3l8Qa7N8xH3OVHj2fQ4vZ9R...
[... 3000+ characters ...]
-----END RSA PRIVATE KEY-----
```

**Public Key (PEM format):**
```
-----BEGIN RSA PUBLIC KEY-----
MIICCgKCAgEAu5Z3l8Qa7N8xH3OVHj2fQ4vZ9R...
[... 500+ characters ...]
-----END RSA PUBLIC KEY-----
```

**Characteristics:**
- ✅ **More secure** - Private key can be kept server-side, public key can be distributed
- ✅ **Distributable** - Third parties can verify tokens without accessing signing key
- ✅ **Industry standard** - Used by OAuth2, OpenID Connect, etc.
- ⚠️ **Slower** - RSA operations are computationally expensive
- ⚠️ **Larger keys** - 4096-bit keys result in larger storage and slower operations
- ⚠️ **Complex** - Requires proper key management and rotation

**Use case:** Distributed systems, third-party integrations, microservices with external partners

---

### Comparison Table

| Feature | Simple (HS256) | Hard (RS256) |
|---------|----------------|--------------|
| **Algorithm** | HMAC-SHA256 | RSA-SHA256 |
| **Key Type** | Symmetric (same key) | Asymmetric (key pair) |
| **Key Size** | 512 bits (128 hex chars) | 4096 bits |
| **Performance** | ⚡ Fast | 🐌 Slower (10-100x) |
| **Security** | ✅ Good (if key protected) | ✅✅ Excellent |
| **Token Verification** | Requires private key | Only needs public key |
| **Third-party Verification** | ❌ Cannot share key | ✅ Can share public key |
| **Key Distribution** | ❌ Impossible | ✅ Public key can be published |
| **Implementation** | Simple | Complex |
| **Current Status** | ✅ **ACTIVE** | ⚠️ Commented out |

---

## Key Lifecycle

### 1. Key Generation (On Every Login/Signup)

```javascript
// access.service.js:41-42 (login) or :91-92 (signup)
const privateKey = crypto.randomBytes(64).toString('hex')
const publicKey = crypto.randomBytes(64).toString('hex')
```

**When:** Every time a user logs in or signs up

**Why new keys every time?**
- Invalidates old sessions automatically
- Prevents token reuse after login
- Enhanced security through key rotation

### 2. Token Creation

```javascript
// authUtils.js:6-14
const accessToken = jwt.sign(
  { userId: shop._id, email },  // Payload
  privateKey,                    // Signing key
  { algorithm: 'HS256', expiresIn: '2 days' }
)

const refreshToken = jwt.sign(
  { userId: shop._id, email },
  privateKey,
  { algorithm: 'HS256', expiresIn: '7 days' }
)
```

**Token Structure:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzRjZDEyM2FiYyIsImVtYWlsIjoidGdraGFuZzIyQGNsYy5maXR1cyIsImlhdCI6MTczMjk5MjAwMCwiZXhwIjoxNzMzMTY0ODAwfQ.signature
│                                       │                                                                                                          │
│          Header (base64)              │                              Payload (base64)                                                            │  Signature
│  {"alg":"HS256","typ":"JWT"}          │  {"userId":"674cd123abc","email":"tgkhang22@clc.fitus","iat":1732992000,"exp":1733164800}              │  HMAC-SHA256
```

### 3. Database Storage

```javascript
// keyToken.service.js:23
await KeyTokenModel.findOneAndUpdate(
  { user: userId },
  {
    publicKey: publicKeyString,
    privateKey: privateKeyString,
    refreshToken: token.refreshToken
  },
  { upsert: true, new: true }
)
```

**MongoDB Document (`Keys` collection):**
```json
{
  "_id": "674cd456def789abc123",
  "user": "674cd123abc456def789",
  "publicKey": "7e5d4c3b2a1987f6e5d4c3b2a1987f6e5d4c3b2a1987f6e5d4c3b2a1987f6e5d4c3b2a1987f6e5d4c3b2a1987f6e5d4c3b2a1987f6e5d4c3b2a1987f6e5d4c3b2a1987f6e5d4c3b2a1987f6",
  "privateKey": "a3f2b9c8d1e4f7a6b5c4d3e2f1a9b8c7d6e5f4a3b2c1d9e8f7a6b5c4d3e2f1a9b8c7d6e5f4a3b2c1d9e8f7a6b5c4d3e2f1a9b8c7d6e5f4a3b2c1d9e8f7a6b5c4d3e2f1a9b8c7d6e5f4",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshTokensUsed": [],
  "createdAt": "2025-12-01T18:30:00.000Z",
  "updatedAt": "2025-12-01T18:30:00.000Z"
}
```

### 4. Token Verification (Future Implementation)

```javascript
// Future: Verify incoming JWT tokens
const decoded = jwt.verify(accessToken, privateKey, {
  algorithms: ['HS256']
})
// decoded = { userId: '674cd123abc', email: 'user@example.com', iat: ..., exp: ... }
```

### 5. Key Invalidation

Keys are invalidated when:
- User logs in again (new keys generated, old ones overwritten)
- User logs out (delete from `Keys` collection)
- Token expires (based on `expiresIn`)

---

## Two-Layer Security

### Layer 1: API Key (Partner Authentication)

**Purpose:** Identify which application/partner is making requests

**Header:** `x-api-key`

**Example:**
```http
POST /v1/shop/login
x-api-key: ece78252d991e1f6dcb6736c14d443fe27ee798589e85327d7ec42158e696c26
```

**Middleware:** `auth/checkAuthen.js:11-32`

**Database:** `ApiKeys` collection
```json
{
  "key": "ece78252d991e1f6dcb6736c14d443fe27ee798589e85327d7ec42158e696c26",
  "status": true,
  "permissions": ["read", "write", "delete"],
  "createdAt": "2025-11-01T00:00:00.000Z"
}
```

**What it controls:**
- ✅ Rate limiting per partner
- ✅ Permission levels (read/write/delete)
- ✅ Partner analytics and tracking
- ✅ API access revocation

---

### Layer 2: JWT Token (User Authentication)

**Purpose:** Identify which specific user is making requests

**Header:** `Authorization: Bearer <token>`

**Example:**
```http
GET /v1/shop/profile
x-api-key: ece78252d991e1f6dcb6736c14d443fe27ee798589e85327d7ec42158e696c26
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Middleware:** (To be implemented)

**What it controls:**
- ✅ User identity and session
- ✅ User-specific permissions
- ✅ Resource access control
- ✅ Stateless authentication

---

### Complete Request Flow

```
┌────────────────────────────────────────────┐
│ Client Request                             │
│ POST /v1/shop/orders                       │
│                                            │
│ Headers:                                   │
│  x-api-key: ece78252...                   │ ← WHO is calling? (Partner)
│  Authorization: Bearer eyJhbGc...         │ ← WHICH USER? (Specific person)
└────────────────────────────────────────────┘
                   ↓
┌────────────────────────────────────────────┐
│ Middleware 1: API Key Check               │
│ ✓ Is this partner allowed?                │
│ ✓ Is the key active?                      │
│ ✓ Does partner have 'write' permission?   │
└────────────────────────────────────────────┘
                   ↓
┌────────────────────────────────────────────┐
│ Middleware 2: JWT Verification (future)    │
│ ✓ Is token valid and not expired?         │
│ ✓ Extract userId from token               │
│ ✓ Check user has permission for resource  │
└────────────────────────────────────────────┘
                   ↓
┌────────────────────────────────────────────┐
│ Controller: Process Request                │
│ req.objKey → API key info                  │
│ req.user → User info from JWT              │
└────────────────────────────────────────────┘
```

**Real-world analogy:**
- **API Key** = Building access card (which company are you from?)
- **JWT Token** = Employee badge (who are you specifically?)

---

## Future Use Cases for Public Key

### 1. Microservices Architecture

**Scenario:** Multiple services need to verify JWT tokens without sharing the private key

```javascript
// Auth Service (creates tokens)
const accessToken = jwt.sign(payload, privateKey, { algorithm: 'RS256' })

// Other Services (verify tokens)
// They only need the public key, not the private key
const decoded = jwt.verify(accessToken, publicKey, { algorithms: ['RS256'] })
```

**Benefits:**
- ✅ Secure - Private key stays only on auth service
- ✅ Scalable - Any service can verify tokens
- ✅ No network calls - Services don't need to call auth service for validation

---

### 2. Third-Party Integrations

**Scenario:** External partners need to verify your tokens

```javascript
// Your server publishes public key at:
// GET https://yourapi.com/.well-known/jwks.json

{
  "keys": [{
    "kty": "RSA",
    "kid": "shop-auth-2025-12-01",
    "use": "sig",
    "n": "u5Z3l8Qa7N8xH3OV...",  // Public key modulus
    "e": "AQAB"                    // Public exponent
  }]
}

// Partner can verify tokens without asking you
const decoded = jwt.verify(token, fetchedPublicKey)
```

**Use cases:**
- Payment gateways verifying your user tokens
- Analytics services tracking authenticated users
- Mobile apps verifying server-issued tokens locally

---

### 3. JWT Token Refresh Without Database Query

**Current flow (HS256):**
```
Client sends refresh token → Server queries DB for privateKey → Verify → Issue new tokens
```

**Future flow (RS256):**
```
Client sends refresh token → Server verifies with cached publicKey → Issue new tokens
```

**Benefits:**
- ⚡ Faster - No database query needed
- 📈 Scalable - Can handle more concurrent requests
- 💾 Reduced DB load

---

### 4. Multiple Auth Servers (Load Balancing)

**Scenario:** Multiple authentication servers behind a load balancer

**HS256 Problem:**
```
User logs in → Server A generates keys → Stores in DB
User refreshes → Load balancer sends to Server B
Server B → Must query DB for Server A's key
```

**RS256 Solution:**
```
All servers share the same RSA key pair
Public key is cached in memory on all servers
No DB query needed for verification
```

---

### 5. Public Key Distribution (JWKS - JSON Web Key Set)

**Standard endpoint:** `/.well-known/jwks.json`

```javascript
// routes/v1/index.js
router.get('/.well-known/jwks.json', async (req, res) => {
  // Fetch latest public keys from database
  const keys = await KeyTokenService.getActivePublicKeys()

  res.json({
    keys: keys.map(k => ({
      kty: 'RSA',
      kid: k._id,
      use: 'sig',
      n: k.publicKey,
      e: 'AQAB'
    }))
  })
})
```

**Used by:**
- OAuth2 providers (Google, Facebook, etc.)
- OpenID Connect flows
- API gateways
- Mobile SDKs

---

### 6. Token Verification in Frontend/Mobile

**Scenario:** Mobile app wants to check if token is valid before making API call

```javascript
// Mobile app (React Native / Flutter)
import jwt_decode from 'jwt-decode'

const decoded = jwt_decode(accessToken)  // No signature verification
// Check expiration: decoded.exp > Date.now() / 1000

// With public key (RS256 only):
const valid = jwt.verify(accessToken, cachedPublicKey)  // Full verification
```

**Benefits:**
- ✅ Reduce unnecessary API calls with expired tokens
- ✅ Better UX - Proactively refresh tokens before expiration
- ✅ Offline validation possible

---

### 7. Cross-Domain Single Sign-On (SSO)

**Scenario:** Multiple domains sharing authentication

```
shop.example.com     → Issues JWT with RS256
api.example.com      → Verifies with public key
analytics.example.com → Verifies with public key
mobile.example.com   → Verifies with public key
```

All services can independently verify tokens without calling the auth service.

---

### 8. Audit and Compliance

**Scenario:** Security audit requires token verification history

```javascript
// Separate audit service
auditService.log({
  token: accessToken,
  verifiedBy: publicKey,
  timestamp: Date.now(),
  result: 'valid'
})
```

**With RSA:**
- ✅ Audit service can verify tokens without access to private key
- ✅ Reduced security risk
- ✅ Better separation of concerns

---

## When to Migrate from HS256 to RS256?

### Stay with HS256 if:
- ✅ Single monolithic application
- ✅ All verification happens on same server
- ✅ No third-party token verification needed
- ✅ Performance is critical
- ✅ Simple architecture

### Migrate to RS256 if:
- ✅ Microservices architecture
- ✅ Third-party integrations need to verify tokens
- ✅ Multiple authentication servers
- ✅ Mobile apps need to verify tokens offline
- ✅ Compliance requires asymmetric cryptography
- ✅ Implementing OAuth2/OpenID Connect

---

## API Reference

### Authentication Endpoints

#### POST /v1/shop/signup
Create new shop account

**Request:**
```http
POST /v1/shop/signup
Content-Type: application/json
x-api-key: your-api-key

{
  "name": "Shop Name",
  "email": "shop@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "code": 201,
  "metadata": {
    "shop": {
      "_id": "674cd123abc456",
      "name": "Shop Name",
      "email": "shop@example.com",
      "role": ["shop"]
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

---

#### POST /v1/shop/login
Authenticate existing shop

**Request:**
```http
POST /v1/shop/login
Content-Type: application/json
x-api-key: your-api-key

{
  "email": "shop@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "metadata": {
    "shop": {
      "_id": "674cd123abc456",
      "name": "Shop Name",
      "email": "shop@example.com"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

---

## Database Schema

### Keys Collection
```javascript
{
  user: ObjectId,           // Reference to Shop
  publicKey: String,        // 128 char hex (HS256) or PEM (RS256)
  privateKey: String,       // 128 char hex (HS256) or PEM (RS256)
  refreshToken: String,     // Full JWT refresh token
  refreshTokensUsed: Array, // Array of previously used refresh tokens
  createdAt: Date,
  updatedAt: Date
}
```

### ApiKeys Collection
```javascript
{
  key: String,              // Unique API key
  status: Boolean,          // Active/inactive
  permissions: [String],    // ['read', 'write', 'delete']
  createdAt: Date,
  // Auto-expires after 30 days
}
```

---

## Security Best Practices

### Current Implementation
- ✅ Passwords hashed with bcrypt (cost factor: 10)
- ✅ JWT tokens have expiration (2 days for access, 7 days for refresh)
- ✅ Keys regenerated on every login
- ✅ API key validation before processing requests

### Recommended Improvements
- 🔄 Implement JWT verification middleware
- 🔄 Add refresh token rotation
- 🔄 Implement logout (delete keys from DB)
- 🔄 Add rate limiting per user
- 🔄 Store refresh tokens hashed (not plain text)
- 🔄 Implement key rotation schedule
- 🔄 Add IP-based suspicious activity detection

---

## Migration Guide: HS256 → RS256

### Step 1: Update Key Generation
```javascript
// Replace in access.service.js
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 4096,
  publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
})
```

### Step 2: Update JWT Signing
```javascript
// Update authUtils.js
const accessToken = jwt.sign(payload, privateKey, {
  algorithm: 'RS256',  // Change from HS256
  expiresIn: '2 days'
})
```

### Step 3: Update Database Schema
```javascript
// Ensure Keys collection can store larger PEM keys
// publicKey and privateKey fields should allow ~3000 characters
```

### Step 4: Add Public Key Endpoint
```javascript
// Expose public keys for third-party verification
router.get('/.well-known/jwks.json', getPublicKeys)
```

### Step 5: Update Verification Logic
```javascript
// Use publicKey instead of privateKey for verification
const decoded = jwt.verify(token, publicKey, {
  algorithms: ['RS256']
})
```

---

## Troubleshooting

### Error: "invalid signature"
- ✓ Check algorithm matches (HS256 vs RS256)
- ✓ Ensure using correct key for verification
- ✓ Verify key hasn't been rotated

### Error: "jwt expired"
- ✓ Check system clock synchronization
- ✓ Verify token expiration time
- ✓ Implement refresh token flow

### Error: "API key is missing"
- ✓ Ensure `x-api-key` header is present
- ✓ Check API key exists in database
- ✓ Verify API key status is active

---

## References

- [JWT.io - JWT Debugger](https://jwt.io/)
- [RFC 7519 - JSON Web Token (JWT)](https://tools.ietf.org/html/rfc7519)
- [RFC 7517 - JSON Web Key (JWK)](https://tools.ietf.org/html/rfc7517)
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
- [jsonwebtoken NPM Package](https://www.npmjs.com/package/jsonwebtoken)

---

**Last Updated:** 2025-12-01
**Version:** 1.0
**Status:** HS256 Active, RS256 Ready (commented)
