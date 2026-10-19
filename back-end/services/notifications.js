import Users from '../models/Users.js'
import admin from 'firebase-admin'
import Joi from 'joi'
import mongoose from 'mongoose'

// Initialize Firebase Admin SDK only if credentials are available
let messaging = null
if (
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
) {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    })
  }
  messaging = admin.messaging()
} else {
  console.warn(
    'Firebase Admin SDK not initialized: Missing required environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)'
  )
}

// Custom validator for ObjectId
const objectIdValidator = (value, helper) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helper.message({ custom: 'Invalid ObjectId' })
  }
  return value
}

// Validation schemas
const updateFcmTokenSchema = Joi.object({
  fcmToken: Joi.string().required().messages({
    'any.required': 'FCM token is required.',
    'string.empty': 'FCM token is required.'
  })
})

const updateNotificationSettingsSchema = Joi.object({
  chat: Joi.boolean().optional(),
  leads: Joi.boolean().optional(),
  announcements: Joi.boolean().optional(),
  tasks: Joi.boolean().optional()
})

const sendNotificationSchema = Joi.object({
  title: Joi.string().min(1).max(100).required().messages({
    'string.min': 'Title must be at least 1 character long.',
    'string.max': 'Title must be less than or equal to 100 characters long.',
    'any.required': 'Title is required.',
    'string.empty': 'Title is required.'
  }),
  body: Joi.string().min(1).max(500).required().messages({
    'string.min': 'Body must be at least 1 character long.',
    'string.max': 'Body must be less than or equal to 500 characters long.',
    'any.required': 'Body is required.',
    'string.empty': 'Body is required.'
  }),
  data: Joi.object().optional(),
  imageUrl: Joi.string().uri().optional()
})

// Helper function to send FCM notification
const sendFCMNotification = async (token, notification) => {
  try {
    // Check if Firebase messaging is available
    if (!messaging) {
      console.warn('Firebase messaging not available, skipping notification')
      return { messageId: 'mock-message-id' }
    }

    const message = {
      token,
      notification: {
        title: notification.title,
        body: notification.body,
        ...(notification.imageUrl && { image: notification.imageUrl })
      },
      data: notification.data || {},
      webpush: {
        headers: {
          Urgency: 'high'
        },
        notification: {
          title: notification.title,
          body: notification.body,
          icon: '/logo192.png', // Your app icon
          badge: '/logo192.png',
          ...(notification.imageUrl && { image: notification.imageUrl }),
          actions: [
            {
              action: 'open',
              title: 'Open'
            },
            {
              action: 'close',
              title: 'Close'
            }
          ]
        },
        fcm_options: {
          link: notification.data.url
        }
      }
    }

    const response = await messaging.send(message)
    console.log('Successfully sent FCM notification:', response)
    return response
  } catch (error) {
    console.error('Error sending FCM notification:', error)
    throw error
  }
}

// Helper function to send notification to multiple users
const sendNotificationToUsers = async (userIds, notification) => {
  try {
    const users = await Users.find({ _id: { $in: userIds } })
    const tokens = users
      .filter(
        (user) =>
          user.fcmToken &&
          user.notificationSettings?.[notification.type] !== false
      )
      .map((user) => user.fcmToken)

    if (tokens.length === 0) {
      console.log('No valid FCM tokens found for users')
      return []
    }

    const results = await Promise.allSettled(
      tokens.map((token) => sendFCMNotification(token, notification))
    )

    const successful = results.filter((result) => result.status === 'fulfilled')
    const failed = results.filter((result) => result.status === 'rejected')

    console.log(
      `Sent ${successful.length} notifications, ${failed.length} failed`
    )
    return { successful: successful.length, failed: failed.length }
  } catch (error) {
    console.error('Error sending notifications to users:', error)
    throw error
  }
}

// API Functions

// Update FCM token
export const updateFcmToken = async (request, reply) => {
  try {
    const { fcmToken } = request.body
    const userId = request.user.userId

    // Validate request body
    const { error } = updateFcmTokenSchema.validate({ fcmToken })
    if (error) {
      const errorMessages = error.details.map((err) => err.message)
      return reply
        .code(400)
        .send({ message: 'Validation Error', errors: errorMessages })
    }

    const user = await Users.findByIdAndUpdate(
      userId,
      { fcmToken },
      { new: true }
    )

    if (!user) {
      return reply.code(404).send({ message: 'User not found' })
    }

    reply.code(200).send({
      message: 'FCM token updated successfully',
      data: { fcmToken: user.fcmToken }
    })
  } catch (error) {
    reply.code(500).send({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

// Update notification settings
export const updateNotificationSettings = async (request, reply) => {
  try {
    const settings = request.body
    const userId = request.user.userId

    // Validate request body
    const { error } = updateNotificationSettingsSchema.validate(settings)
    if (error) {
      const errorMessages = error.details.map((err) => err.message)
      return reply
        .code(400)
        .send({ message: 'Validation Error', errors: errorMessages })
    }

    const user = await Users.findByIdAndUpdate(
      userId,
      { notificationSettings: settings },
      { new: true }
    )

    if (!user) {
      return reply.code(404).send({ message: 'User not found' })
    }

    reply.code(200).send({
      message: 'Notification settings updated successfully',
      data: { notificationSettings: user.notificationSettings }
    })
  } catch (error) {
    reply.code(500).send({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

// Get notification settings
export const getNotificationSettings = async (request, reply) => {
  try {
    const userId = request.user.userId

    const user = await Users.findById(userId).select('notificationSettings')
    if (!user) {
      return reply.code(404).send({ message: 'User not found' })
    }

    reply.code(200).send({
      message: 'Notification settings fetched successfully',
      data: { notificationSettings: user.notificationSettings }
    })
  } catch (error) {
    reply.code(500).send({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

// Send notification to specific user
export const sendNotificationToUser = async (request, reply) => {
  try {
    const { userId } = request.params
    const notification = request.body

    // Validate parameters
    const { error } = Joi.object({
      userId: Joi.string().custom(objectIdValidator).required(),
      ...sendNotificationSchema.describe().keys
    }).validate({ userId, ...notification })

    if (error) {
      const errorMessages = error.details.map((err) => err.message)
      return reply
        .code(400)
        .send({ message: 'Validation Error', errors: errorMessages })
    }

    const result = await sendNotificationToUsers([userId], notification)

    reply.code(200).send({
      message: 'Notification sent successfully',
      data: result
    })
  } catch (error) {
    reply.code(500).send({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

// Send notification to multiple users
export const sendNotificationToMultipleUsers = async (request, reply) => {
  try {
    const { userIds } = request.body
    const notification = request.body

    // Validate request body
    const { error } = Joi.object({
      userIds: Joi.array()
        .items(Joi.string().custom(objectIdValidator))
        .min(1)
        .required(),
      ...sendNotificationSchema.describe().keys
    }).validate({ userIds, ...notification })

    if (error) {
      const errorMessages = error.details.map((err) => err.message)
      return reply
        .code(400)
        .send({ message: 'Validation Error', errors: errorMessages })
    }

    const result = await sendNotificationToUsers(userIds, notification)

    reply.code(200).send({
      message: 'Notifications sent successfully',
      data: result
    })
  } catch (error) {
    reply.code(500).send({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

// Send notification to all users
export const sendNotificationToAllUsers = async (request, reply) => {
  try {
    const notification = request.body

    // Validate request body
    const { error } = sendNotificationSchema.validate(notification)
    if (error) {
      const errorMessages = error.details.map((err) => err.message)
      return reply
        .code(400)
        .send({ message: 'Validation Error', errors: errorMessages })
    }

    const users = await Users.find({ fcmToken: { $exists: true, $ne: null } })
    const userIds = users.map((user) => user._id)

    const result = await sendNotificationToUsers(userIds, notification)

    reply.code(200).send({
      message: 'Notifications sent to all users successfully',
      data: result
    })
  } catch (error) {
    reply.code(500).send({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

// Export helper functions for use in other services
export { sendFCMNotification, sendNotificationToUsers }
