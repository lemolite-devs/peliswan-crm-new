import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(process.cwd(), 'back-end', '.env') })

const db = async (fastify, options) => {
  // Use MONGODB_URI if available, otherwise fall back to the old naming convention
  let dbUri = process.env.MONGODB_URI

  if (!dbUri) {
    console.error('❌ No database URI found! Please check your .env file.')
    throw new Error('Database URI not configured')
  }

  try {
    await mongoose.connect(dbUri)
    fastify.log.info('✅ MongoDB connected successfully')
  } catch (err) {
    fastify.log.error('❌ MongoDB connection failed:', err.message)
    throw err
  }
}

export default db
