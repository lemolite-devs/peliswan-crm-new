import fastifyPlugin from 'fastify-plugin'
import verifyToken from '../middleware/verifyToken.js'
import {
  updateFcmToken,
  updateNotificationSettings,
  getNotificationSettings,
  sendNotificationToUser,
  sendNotificationToMultipleUsers,
  sendNotificationToAllUsers
} from '../services/notifications.js'

async function notifications(fastify, options) {
  // FCM Token management
  fastify.put(
    '/api/notifications/fcm-token',
    { preHandler: [verifyToken] },
    updateFcmToken
  )

  // Notification settings
  fastify.put(
    '/api/notifications/settings',
    { preHandler: [verifyToken] },
    updateNotificationSettings
  )

  fastify.get(
    '/api/notifications/settings',
    { preHandler: [verifyToken] },
    getNotificationSettings
  )

  // Send notifications
  fastify.post(
    '/api/notifications/send/user/:userId',
    { preHandler: [verifyToken] },
    sendNotificationToUser
  )

  fastify.post(
    '/api/notifications/send/multiple',
    { preHandler: [verifyToken] },
    sendNotificationToMultipleUsers
  )

  fastify.post(
    '/api/notifications/send/all',
    { preHandler: [verifyToken] },
    sendNotificationToAllUsers
  )
}

export default fastifyPlugin(notifications)
