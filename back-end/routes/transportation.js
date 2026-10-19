import {
  getTransportationRoutes,
  getTransportationRouteById,
  addTransportationRoute,
  updateTransportationRoute,
  deleteTransportationRoute,
  bulkUploadTransportationRoutes
} from '../services/transportation.js'
import fastifyPlugin from 'fastify-plugin'
import verifyToken from '../middleware/verifyToken.js'
import { Users } from '../models/index.js'

// Middleware to check USER23 authorization for write operations
const checkUser23Authorization = async (request, reply) => {
  try {
    const user = await Users.findById(request.user.userId)
    if (!user || user.userID !== 'USER23') {
      return reply.status(403).send({
        message: 'Only USER23 can perform this action'
      })
    }
  } catch (error) {
    return reply.status(500).send({
      message: 'Error verifying user authorization'
    })
  }
}

async function transportation(fastify, options) {
  // Get all transportation routes
  fastify.get(
    '/api/transportation',
    { preHandler: [verifyToken] },
    getTransportationRoutes
  )

  // Get transportation route by ID
  fastify.get(
    '/api/transportation/:id',
    { preHandler: [verifyToken] },
    getTransportationRouteById
  )

  // Add new transportation route
  fastify.post(
    '/api/transportation',
    { preHandler: [verifyToken, checkUser23Authorization] },
    addTransportationRoute
  )

  // Update transportation route
  fastify.put(
    '/api/transportation/:id',
    { preHandler: [verifyToken, checkUser23Authorization] },
    updateTransportationRoute
  )

  // Delete transportation route
  fastify.delete(
    '/api/transportation/:id',
    { preHandler: [verifyToken, checkUser23Authorization] },
    deleteTransportationRoute
  )

  // Bulk upload transportation routes
  fastify.post(
    '/api/transportation/bulk-upload',
    { preHandler: [verifyToken, checkUser23Authorization] },
    bulkUploadTransportationRoutes
  )
}

export default fastifyPlugin(transportation)
