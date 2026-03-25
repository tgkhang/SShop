/**
 * Custom ESM loader hook — resolves imports without file extensions.
 * Tries .js then /index.js for relative and # subpath imports.
 */
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import { resolve as resolvePath } from 'node:path'

export async function resolve(specifier, context, nextResolve) {
  // Already has an extension or is a bare package specifier — skip
  if (/\.\w+$/.test(specifier) || (!specifier.startsWith('.') && !specifier.startsWith('/') && !specifier.startsWith('#'))) {
    return nextResolve(specifier, context)
  }

  // For # subpath imports, let Node resolve first, then retry with .js if it fails
  if (specifier.startsWith('#')) {
    try {
      return await nextResolve(specifier, context)
    } catch {
      return nextResolve(specifier + '.js', context)
    }
  }

  // Relative imports — try adding .js, then /index.js
  const base = context.parentURL ? fileURLToPath(context.parentURL) : process.cwd()
  const candidates = [specifier + '.js', specifier + '/index.js']

  for (const candidate of candidates) {
    try {
      return await nextResolve(candidate, context)
    } catch {}
  }

  return nextResolve(specifier, context)
}
