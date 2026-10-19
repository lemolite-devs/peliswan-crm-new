import crypto from 'crypto'
import { decrypt } from '../utils/cryptoUtils.js'
import dotenv from 'dotenv'
import { Users, Roles, Counter } from '../models/index.js'

//User GET by ID
import Joi from 'joi'
import mongoose from 'mongoose'
import { userInfo } from 'os'
// Validation schema
const userSchema = Joi.object({
  name: Joi.string()
    .min(3) // Minimum length of 3 characters
    .max(100) // Maximum length of 100 characters (optional)
    .required()
    .messages({
      'string.min': 'Name must be at least 3 characters long.',
      'string.max': 'Name can be at most 100 characters long.',
      'any.required': 'Name is required.',
      'string.empty': 'Name cannot be empty.'
    }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email must be a valid email address.',
    'any.required': 'Email is required.',
    'string.empty': 'Email is required.'
  }),
  password: Joi.string()
    .min(6) // Minimum length of 6 characters
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long.',
      'any.required': 'Password is required.',
      'string.empty': 'Password cannot be empty.'
    }),

  role: Joi.string().required().messages({
    'any.required': 'Role is required.',
    'string.empty': 'Role cannot be empty.'
  }),
  mobileNumber: Joi.string()
    .min(10) // Minimum length of 10 characters
    .max(15) // Maximum length of 15 characters
    .required()
    .messages({
      'string.min': 'Mobile number must be at least 10 characters long.',
      'string.max':
        'Mobile number must be less than or equal to 15 characters long.',
      'any.required': 'Mobile number is required.',
      'string.empty': 'Mobile number cannot be empty.'
    }),
  city: Joi.string().optional().messages({
    'string.empty': 'City cannot be empty if provided.'
  })
})

dotenv.config()

const algorithm = 'aes-256-cbc'
const key = process.env.ENCRYPTION_KEY
  ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
  : null

if (!key) {
  console.error('ENCRYPTION_KEY is not defined or is invalid')
}

const ivLength = 16

export function encrypt(text) {
  if (!text) {
    console.error('Missing text to encrypt')
  }

  const iv = crypto.randomBytes(ivLength).toString('hex')
  const cipher = crypto.createCipheriv(algorithm, key, Buffer.from(iv, 'hex'))
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return { iv, encryptedData: encrypted.toString('hex') }
}

const getNextSequence = async (user) => {
  try {
    // Find the counter document for the given entity
    let counter = await Counter.findOne({ entity: user })
    // If the counter document doesn't exist, create a new one
    if (!counter) {
      counter = new Counter({ entity: user, count: 0 })
    }
    // Increment the count by one
    counter.count++
    // Save the updated counter document
    await counter.save()
    // Return the incremented count
    return counter.count
  } catch (error) {
    console.error('Error fetching next sequence:', error)
    throw error
  }
}
export const newUser = async (request, reply) => {
  const { name, email, password, role, mobileNumber, city } = request.body

  const { error } = userSchema.validate(request.body, {
    abortEarly: false
  })
  if (error) {
    const errorMessages = error.details.map((err) => err.message)
    return reply
      .code(400)
      .send({ message: 'Validation Error', errors: errorMessages })
  }

  try {
    // Find the role by name
    const roles = await Roles.findOne({ name: role })
    if (!roles) {
      return reply
        .code(400)
        .send({ success: false, message: 'Invalid role name' })
    }

    // Generate a unique user ID
    const userCount = await getNextSequence('user')
    const userId = `USER${userCount}`

    // Encrypt the password
    const { iv, encryptedData } = encrypt(password)

    // Create a new user
    const user = new Users({
      name,
      userID: userId,
      email,
      password: encryptedData,
      iv, // Store the IV along with the encrypted password
      role: roles._id,
      mobileNumber,
      city
    })
    // Save the user to the database
    await user.save()

    reply.code(201).send({ success: true, userID: userId })
  } catch (error) {
    if (error.code === 11000 && error.keyValue.email) {
      reply
        .code(409)
        .send({ success: false, message: 'This email already exists' })
    } else if (error.code === 11000 && error.keyValue.mobileNumber) {
      reply
        .code(409)
        .send({ success: false, message: 'This number already exists' })
    }

    reply.code(500).send({ success: false, message: 'Internal Server Error' })
  }
}

export const getUsers = async (request, reply) => {
  try {
    const users = await Users.find()
      .populate({
        path: 'role',
        select: 'name'
      })
      .select('name email mobileNumber userID city password')
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
    const totalUsers = users.length
    reply.send({ users, totalUsers })
  } catch (error) {
    reply.code(500).send({ message: 'Failed to fetch users.' })
  }
}

export const updateUserById = async (request, reply) => {
  const { userId } = request.params

  const { error } = userSchema.validate(request.body, {
    abortEarly: false
  })
  if (error) {
    const errorMessages = error.details.map((err) => err.message)
    return reply
      .code(400)
      .send({ message: 'Validation Error', errors: errorMessages })
  }

  const { name, email, password, role, mobileNumber, city } = request.body

  try {
    // Find the user by ID
    const user = await Users.findById(userId)
    if (!user) {
      return reply.code(404).send({ message: 'User not found.' })
    }

    // Prepare update data
    const updateData = { name, email, role, mobileNumber, city }

    // Check if the password field is provided and has changed
    if (password && password !== user.password) {
      const { iv, encryptedData } = encrypt(password)
      updateData.password = encryptedData
      updateData.iv = iv
    } else {
      // Do not include the password field in the update if it is not changing
      delete updateData.password
      delete updateData.iv
    }

    // Update user data
    const updatedUser = await Users.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true
    })

    if (!updatedUser) {
      return reply.code(404).send({ message: 'User not found.' })
    }

    reply.send(updatedUser)
  } catch (error) {
    // Handle unique constraint error
    if (error.code === 11000 && error.keyValue.email) {
      reply
        .code(409)
        .send({ success: false, message: 'This email already exists' })
    } else if (error.code === 11000 && error.keyValue.mobileNumber) {
      reply
        .code(409)
        .send({ success: false, message: 'This number already exists' })
    }
    // Handle other errors
    reply.code(500).send({ message: 'Failed to update user.' })
  }
}

export const deleteUserById = async (request, reply) => {
  const { userId } = request.params

  // Validate ID format (assuming a simple check for MongoDB ObjectId)
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return reply.code(400).send({ message: 'Invalid user ID format.' })
  }

  try {
    // Find user by ID and delete
    const result = await Users.findByIdAndDelete(userId)

    if (!result) {
      return reply.code(404).send({ message: 'User not found.' })
    }

    reply.code(200).send({ message: 'User successfully deleted.' })
  } catch (error) {
    reply.code(500).send({ message: 'Failed to delete user.' })
  }
}

export const getUserById = async (request, reply) => {
  try {
    const { userId } = request.params

    // Check if userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return reply.code(400).send({ message: 'Invalid user ID format' })
    }

    // Convert userId to ObjectId
    const id = new mongoose.Types.ObjectId(userId)

    // Find user by ObjectId (include userID so frontend gets the string ID)
    const user = await Users.findById(id)
      .select('email name userID')
      .populate('role')

    if (!user) {
      return reply.code(404).send({ message: 'User not found' })
    }

    const response = {
      id: user._id,
      userID: user.userID,
      role: user.role.name,
      name: user.name,
      email: user.email,
      permissions: user.role.permissions
    }

    reply
      .code(200)
      .send({ message: 'User Data Fetch Successfully', user: response })
  } catch (error) {
    console.error('Error fetching user:', error) // Log detailed error
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}
export const passwordDecrypt = async (request, reply) => {
  try {
    const { userId } = request.params

    // Check if userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return reply.code(400).send({ message: 'Invalid user ID format' })
    }

    // Convert userId to ObjectId
    const id = new mongoose.Types.ObjectId(userId)

    // Find user by ObjectId
    const user = await Users.findById(id).select('password iv')

    if (!user) {
      return reply.code(404).send({ message: 'User not found' })
    }

    const decryptedStoredPassword = decrypt(user.password, user.iv)
    const response = {
      password: decryptedStoredPassword
    }

    reply
      .code(200)
      .send({ message: 'Password Fetch Successfully', user: response })
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}

export const lookUpUsers = async (request, reply) => {
  try {
    const { allowRole = ['Admin', 'Sales Executive', 'Sales Manager'] } =
      request.query

    const items = await Users.find()
      .populate({
        path: 'role',
        select: 'name',
        match: { name: { $in: allowRole } } // Filter roles by allowed names
      })
      .select('name')
      .exec()

    // Filter out users without a matching role
    const mappedUsers = items
      .filter((item) => item.role)
      .map((item) => ({
        id: item._id,
        name: item.name,
        role: item.role.name
      }))

    reply
      .code(200)
      .send({ message: 'User Fetch Successfully', users: mappedUsers })
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}
