# Node.js Module Import Configuration Guide

## Current Project Setup

Your project uses **ES Modules** (ESM) with the following configuration:

**package.json:**
```json
{
  "type": "module",
  "imports": {
    "#*": "./src/*"
  }
}
```

This allows you to use path aliases like:
```javascript
import { something } from '#models/user.model.js'
import { something } from '#services/user.service.js'
```

---

## The `.js` Extension Requirement

### Why Node.js Requires `.js` Extension

When using ES Modules (`"type": "module"`), Node.js **requires** explicit file extensions in import statements. This is by design and follows the ES Module specification.

```javascript
// ✅ CORRECT - Works in Node.js ESM
import { convertToObjectId } from '#utils/index.js'

// ❌ WRONG - Does NOT work in Node.js ESM
import { convertToObjectId } from '#utils/index'
import { convertToObjectId } from '#utils'
```

### Why This Requirement Exists

1. **Explicit Resolution**: Makes it clear what file you're importing
2. **Performance**: Faster module resolution (no need to search for files)
3. **Compatibility**: Works consistently across different environments
4. **Standards Compliance**: Follows ECMAScript module specification

---

## Solutions to Avoid `.js` Extensions

### Solution 1: Use Package.json Exports (Recommended)

Create a `package.json` in each directory you want to import without extensions.

**Example: src/utils/package.json**
```json
{
  "type": "module",
  "main": "index.js",
  "exports": {
    ".": "./index.js",
    "./*": "./*.js"
  }
}
```

Then you can import:
```javascript
import { convertToObjectId } from '#utils'  // ✅ Works!
```

**Pros:**
- Clean imports without extensions
- Standards-compliant
- Works with Node.js native ESM

**Cons:**
- Need to create package.json in multiple directories
- More files to maintain

---

### Solution 2: Update Package.json Imports Mapping

Modify your root `package.json` to explicitly map common imports:

**package.json:**
```json
{
  "type": "module",
  "imports": {
    "#*": "./src/*",
    "#utils": "./src/utils/index.js",
    "#utils/*": "./src/utils/*.js",
    "#models/*": "./src/models/*.js",
    "#services/*": "./src/services/*.js",
    "#controllers/*": "./src/controllers/*.js",
    "#routes/*": "./src/routes/*.js",
    "#helpers/*": "./src/helpers/*.js",
    "#auth/*": "./src/auth/*.js",
    "#core/*": "./src/core/*.js",
    "#builders/*": "./src/builders/*.js"
  }
}
```

Then you can use:
```javascript
import { convertToObjectId } from '#utils'  // ✅ Maps to ./src/utils/index.js
import { UserModel } from '#models/user.model'  // Still needs .js
```

**Pros:**
- Cleaner imports for index files
- Centralized configuration
- Easy to maintain

**Cons:**
- Still need `.js` for non-index files (by design)
- Only helps with specific mapped paths

---

### Solution 3: Use a Bundler (Webpack/Vite/ESBuild)

If you're willing to use a build step, bundlers can resolve imports without extensions.

**Install ESBuild:**
```bash
npm install --save-dev esbuild
```

**package.json scripts:**
```json
{
  "scripts": {
    "build": "esbuild src/server.js --bundle --platform=node --outfile=dist/server.js",
    "start": "node dist/server.js"
  }
}
```

**Pros:**
- Can omit extensions completely
- Additional optimizations (minification, tree-shaking)
- Fast build times with esbuild

**Cons:**
- Requires build step
- More complex setup
- Debug stack traces point to bundled code

---

### Solution 4: Use TypeScript (Future-Proof)

TypeScript allows you to write imports without extensions, and it transpiles them correctly.

**Install TypeScript:**
```bash
npm install --save-dev typescript tsx
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "node",
    "target": "ES2022",
    "outDir": "./dist",
    "rootDir": "./src",
    "paths": {
      "#*": ["./src/*"]
    }
  }
}
```

**Rename files:**
- `*.js` → `*.ts`

**Run with tsx:**
```bash
npm install --save-dev tsx
npx tsx src/server.ts
```

**Pros:**
- Type safety
- Better IDE support
- Can omit extensions
- Industry standard for large projects

**Cons:**
- Learning curve
- Need to migrate existing code
- Compilation step

---

### Solution 5: Use Import Maps (Experimental)

Node.js supports experimental import maps.

**Create import-map.json:**
```json
{
  "imports": {
    "#utils": "./src/utils/index.js",
    "#models/": "./src/models/",
    "#services/": "./src/services/"
  }
}
```

**Run with flag:**
```bash
node --experimental-import-maps=import-map.json src/server.js
```

**Pros:**
- Standards-based
- Clean syntax

**Cons:**
- Experimental (not production-ready)
- Requires flag
- Not widely adopted yet

---

## Recommended Approach for Your Project

### Option A: Keep Current Setup (Easiest)

**Just use `.js` extensions everywhere:**

```javascript
// Current working pattern
import { convertToObjectId } from '#utils/index.js'
import { UserModel } from '#models/user.model.js'
import { UserService } from '#services/user.service.js'
```

**Why this is good:**
- ✅ Works with zero configuration
- ✅ Explicit and clear
- ✅ No build step required
- ✅ Fast development
- ✅ Node.js native ESM

**Setup:**
Nothing! Just keep using what you have.

---

### Option B: Add Specific Mappings (Moderate)

**Update package.json to map common directories:**

```json
{
  "type": "module",
  "imports": {
    "#*": "./src/*",
    "#utils": "./src/utils/index.js",
    "#utils/*": "./src/utils/*"
  }
}
```

**Usage:**
```javascript
// ✅ Works for utils index
import { convertToObjectId } from '#utils'

// ⚠️ Still needs .js for other files
import { UserModel } from '#models/user.model.js'
```

**Setup:**
1. Add mappings to package.json
2. Update existing imports for mapped paths
3. Keep `.js` for non-mapped imports

---

### Option C: Migrate to TypeScript (Long-term)

**For larger projects or teams:**

1. Install TypeScript:
   ```bash
   npm install --save-dev typescript @types/node tsx
   ```

2. Create tsconfig.json:
   ```bash
   npx tsc --init
   ```

3. Configure paths:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "#*": ["./src/*"]
       }
     }
   }
   ```

4. Rename files: `*.js` → `*.ts`

5. Run with tsx:
   ```bash
   npx tsx src/server.ts
   ```

**Why TypeScript:**
- ✅ Type safety prevents bugs
- ✅ Better IDE autocomplete
- ✅ Can omit `.js` extensions
- ✅ Industry standard
- ✅ Easier refactoring

---

## Current Import Patterns in Your Project

Based on codebase analysis:

```javascript
// ✅ CORRECT patterns currently used
import { WHITELIST_DOMAINS } from '#utils/constants.js'
import { convertToObjectId } from '#utils/index.js'
import { UserModel } from '#models/user.model.js'
import { DiscountService } from '#services/discount.service.js'

// ❌ INCORRECT (will fail)
import { convertToObjectId } from '#utils.js'  // Should be #utils/index.js
import { convertToObjectId } from '#utils'     // Needs .js extension
```

---

## Quick Fix Guide

### If you see this error:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/path/to/utils.js'
```

### Solutions:

**1. Check if it's a directory import:**
```javascript
// ❌ Wrong
import { something } from '#utils'

// ✅ Fix: Add /index.js
import { something } from '#utils/index.js'
```

**2. Check if extension is missing:**
```javascript
// ❌ Wrong
import { UserModel } from '#models/user.model'

// ✅ Fix: Add .js
import { UserModel } from '#models/user.model.js'
```

**3. Check if path is correct:**
```javascript
// ❌ Wrong
import { convertToObjectId } from '#utils.js'

// ✅ Fix: Correct path
import { convertToObjectId } from '#utils/index.js'
```

---

## Summary

### Current Setup (No Config Needed)
- ✅ Use `.js` extensions in all imports
- ✅ Use `#` prefix for src aliases
- ✅ Use `/index.js` for directory imports

### Future Options
1. **Keep it simple**: Continue with `.js` extensions
2. **Add mappings**: Update package.json for common paths
3. **Use TypeScript**: Best long-term solution for larger projects

### Recommendation
**For your current project size**: Keep using `.js` extensions. It's simple, fast, and requires no configuration.

**If project grows**: Consider TypeScript for better type safety and DX.

---

## Common Import Patterns Reference

```javascript
// Models
import { UserModel } from '#models/user.model.js'
import { ProductModel } from '#models/product.model.js'

// Services
import { UserService } from '#services/user.service.js'
import { ProductService } from '#services/product.service.js'

// Controllers
import userController from '#controllers/user.controller.js'
import productController from '#controllers/product.controller.js'

// Utils (index file)
import { convertToObjectId, getInfoData } from '#utils/index.js'

// Utils (specific file)
import { WHITELIST_DOMAINS } from '#utils/constants.js'

// Core
import { BadRequestError } from '#core/error.response.js'
import { SuccessResponse } from '#core/success.response.js'

// Auth
import { authenticationV2 } from '#auth/authUtils.js'

// Helpers
import { asyncHandler } from '#helpers/asyncHandler.js'
```

---

## Additional Resources

- [Node.js ES Modules Documentation](https://nodejs.org/api/esm.html)
- [Package.json Imports Field](https://nodejs.org/api/packages.html#imports)
- [TypeScript Configuration](https://www.typescriptlang.org/docs/handbook/modules.html)
- [ESBuild Documentation](https://esbuild.github.io/)
