# JWT Authentication Flow

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. POST /signup (email, password, name)
       ▼
┌─────────────────────────────────────────────────┐
│              Access Controller                  │
└──────┬──────────────────────────────────────────┘
       │
       │ 2. Call AccessService.signUp()
       ▼
┌─────────────────────────────────────────────────┐
│              Access Service                     │
│  ┌──────────────────────────────────────────┐   │
│  │ • Hash password with bcrypt              │   │
│  │ • Create shop in database                │   │
│  │ • Generate RSA key pair (4096 bit)       │   │
│  │   - Private Key (kept in memory)         │   │
│  │   - Public Key (stored in DB)            │   │
│  └──────────────────────────────────────────┘   │
└──────┬──────────────────────────────────────────┘
       │
       │ 3. Store public key
       ▼
┌─────────────────────────────────────────────────┐
│           KeyToken Service                      │
│  • Save publicKey to database                   │
│  • Link to shop's userId                        │
└──────┬──────────────────────────────────────────┘
       │
       │ 4. Create token pair
       ▼
┌─────────────────────────────────────────────────┐
│              Auth Utils                         │
│  ┌──────────────────────────────────────────┐   │
│  │ Sign with PRIVATE KEY:                   │   │
│  │                                          │   │
│  │ Access Token                             │   │
│  │ • Payload: {userId, email, roles}        │   │
│  │ • Expires: 2 days                        │   │
│  │ • Algorithm: RS256                       │   │
│  │                                          │   │
│  │ Refresh Token                            │   │
│  │ • Payload: {userId, email, roles}        │   │
│  │ • Expires: 7 days                        │   │
│  │ • Algorithm: RS256                       │   │
│  └──────────────────────────────────────────┘   │
└──────┬──────────────────────────────────────────┘
       │
       │ 5. Return tokens to client
       ▼
┌─────────────────────────────────────────────────┐
│   Response to Client                            │
│   {                                             │
│     code: 201,                                  │
│     metadata: {                                 │
│       shop: {...},                              │
│       tokens: {                                 │
│         accessToken: "eyJhbG...",               │
│         refreshToken: "eyJhbG..."               │
│       }                                         │
│     }                                           │
│   }                                             │
└─────────────────────────────────────────────────┘
```

## Token Usage Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ Store tokens in memory/localStorage
       │
       │ 6. Make authenticated request
       │    Header: Authorization: Bearer <accessToken>
       ▼
┌─────────────────────────────────────────────────┐
│         Protected Route Middleware              │
│  ┌──────────────────────────────────────────┐   │
│  │ • Extract token from header              │   │
│  │ • Fetch public key from database         │   │
│  │ • Verify token using PUBLIC KEY          │   │
│  │ • Check expiration                       │   │
│  │ • Attach user data to request            │   │
│  └──────────────────────────────────────────┘   │
└──────┬──────────────────────────────────────────┘
       │
       │ Token valid ✓
       ▼
┌─────────────────────────────────────────────────┐
│         Protected Resource                      │
│         (Access granted)                        │
└─────────────────────────────────────────────────┘
```

## Why JWT Can Be Decoded Without a Secret

### The Common Misconception

Many people think JWT tokens are encrypted and need a secret to read them. **This is wrong!**

### The Truth: JWT is Signed, Not Encrypted

A JWT token has three parts separated by dots (`.`):

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTYzMjQ4MzIwMH0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
│                                      │                                                                                     │
│          HEADER (Base64)             │                      PAYLOAD (Base64)                                              │          SIGNATURE
```

1. **Header** (Base64 encoded)

   ```json
   {
     "alg": "RS256",
     "typ": "JWT"
   }
   ```

2. **Payload** (Base64 encoded)

   ```json
   {
     "userId": "12345",
     "email": "test@example.com",
     "roles": ["shop"],
     "iat": 1632483200,
     "exp": 1632569600
   }
   ```

3. **Signature** (RSA signature)
   ```
   RSASSA-PKCS1-v1_5(
     SHA256(base64(header) + "." + base64(payload)),
     privateKey
   )
   ```

### Why Anyone Can Decode It

**Base64 is NOT encryption - it's just encoding!**

```javascript
// Anyone can decode without any key:
const decoded = jwt.decode(token)
console.log(decoded) // See all the data!
```

The payload is **publicly readable** by design. You can even decode it on [jwt.io](https://jwt.io) or in browser console.

### So Why Is It Secure?

Security comes from the **signature**, not hiding the data:

#### What the Private Key Does (Signing)

```javascript
// Server creates signature using PRIVATE KEY
const signature = sign(header + payload, privateKey)
```

- Only the server can create valid signatures
- The signature proves: "This token was created by the legitimate server"

#### What the Public Key Does (Verification)

```javascript
// Server verifies signature using PUBLIC KEY
const isValid = verify(token, publicKey)
```

- Anyone can verify the token is authentic
- Cannot create new valid tokens with public key
- Can only confirm if signature is valid

### The Security Model

✅ **What JWT Protects Against:**

- **Tampering**: If someone changes `userId: "123"` to `userId: "456"`, the signature becomes invalid
- **Forgery**: Cannot create fake tokens without the private key
- **Impersonation**: Cannot pretend to be another user

❌ **What JWT Does NOT Protect:**

- **Confidentiality**: Anyone can read the payload
- **Sensitive Data**: Never put passwords, credit cards, etc. in JWT

### Example Attack Scenario

```javascript
// Attacker intercepts token and tries to change userId
const token = 'eyJhbGc...original.payload...signature'

// Decode it (anyone can do this)
const decoded = jwt.decode(token)
// { userId: "123", email: "victim@example.com" }

// Try to change userId
const fakePayload = { userId: '456', email: 'victim@example.com' }
const fakeToken = base64(header) + '.' + base64(fakePayload) + '.' + oldSignature

// When server verifies:
jwt.verify(fakeToken, publicKey) // ❌ FAILS!
```

## Key Storage Strategy

### Private Key

- **Location**: Generated on-the-fly, kept in memory only
- **Usage**: Sign tokens (create)
- **Security**: Never stored in database, never sent to client
- **Lifetime**: Per signup session only

### Public Key

- **Location**: Stored in database (KeyToken collection)
- **Usage**: Verify tokens (validate)
- **Security**: Safe to expose (but kept server-side)
- **Lifetime**: Permanent until user logs out

## Best Practices

### ✅ DO:

- Use JWT for stateless authentication
- Store only non-sensitive data in payload
- Use short expiration times
- Use refresh tokens for long sessions
- Verify signatures on every request
- Store tokens in httpOnly cookies (better) or localStorage

### ❌ DON'T:

- Put passwords in JWT payload
- Put credit card info in JWT payload
- Store private keys in database
- Share private keys
- Trust decoded JWT without verification
- Use JWT for sensitive sessions (banking, etc.)
