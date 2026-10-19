import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

const algorithm = 'aes-256-cbc'
const key = process.env.ENCRYPTION_KEY
  ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
  : null

if (!key) {
  throw new Error('ENCRYPTION_KEY is not defined or is invalid')
}

const ivLength = 16

export function decrypt(encryptedText, iv) {
  if (!encryptedText || !iv) {
    throw new Error('Missing encryptedText or iv')
  }

  const ivBuffer = Buffer.from(iv, 'hex')
  const encryptedTextBuffer = Buffer.from(encryptedText, 'hex')
  const decipher = crypto.createDecipheriv(algorithm, key, ivBuffer)
  let decrypted = decipher.update(encryptedTextBuffer)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}

export function encrypt(text) {
  if (!text) {
    throw new Error('Missing text to encrypt')
  }

  const iv = crypto.randomBytes(ivLength).toString('hex')
  const cipher = crypto.createCipheriv(algorithm, key, Buffer.from(iv, 'hex'))
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return { iv, encryptedData: encrypted.toString('hex') }
}
