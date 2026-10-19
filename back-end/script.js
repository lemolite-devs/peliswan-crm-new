import mongoose from 'mongoose'
import Users from './models/Users.js' // Update the path if needed
import { encrypt as encryptPassword } from './utils/cryptoUtils.js'

// Connect to the database
const connectDb = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/peliswan-sales-crm', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    console.log('Database connected')
  } catch (error) {
    console.error('Database connection error:', error)
    process.exit(1)
  }
}

// Encrypt and update passwords
const updatePasswords = async () => {
  try {
    const users = await Users.find()

    for (const user of users) {
      if (user.password && !user.iv) {
        // Check if iv is not already set
        // Encrypt password if not already encrypted
        const { iv, encryptedData } = encryptPassword(user.password)
        user.password = encryptedData // Save the encrypted data
        user.iv = iv // Save the iv
        await user.save()
      }
    }
    console.log('All passwords updated successfully')
  } catch (error) {
    console.error('Error updating passwords:', error)
  }
}

const run = async () => {
  await connectDb()
  await updatePasswords()
  mongoose.connection.close()
}

run()
