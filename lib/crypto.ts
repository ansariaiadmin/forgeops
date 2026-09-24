import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

/**
 * Field-level encryption for sensitive values (EnvironmentVariable.value).
 * AES-256-GCM with a 12-byte IV and a 16-byte auth tag — format:
 *   ivHex.tagHex.ciphertextHex
 *
 * Set ENCRYPTION_KEY (32 bytes, hex) in .env:
 *   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
 */

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY
  if (!secret || secret.length < 64) {
    throw new Error(
      "ENCRYPTION_KEY is not set or invalid (need 32 bytes as hex). Generate one with: node -e \"console.log(require('node:crypto').randomBytes(32).toString('hex'))\"",
    )
  }
  return Buffer.from(secret, 'hex')
}

/** Encrypt a plaintext string. */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join('.')
}

/** Decrypt a payload produced by encrypt(). Throws on tampering. */
export function decrypt(payload: string): string {
  const [ivHex, tagHex, dataHex] = payload.split('.')
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error('Invalid encrypted payload.')
  }
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()])
  return decrypted.toString('utf8')
}

/** Test round-trip; also demonstrates usage. */
export function selfTest(): boolean {
  const sample = 'forgeops-secret-value-42'
  const encrypted = encrypt(sample)
  return decrypt(encrypted) === sample
}
