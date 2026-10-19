import fastifyPlugin from 'fastify-plugin'
import verifyToken from '../middleware/verifyToken.js'
import {
  newUpdate,
  getUpdates,
  updateModifyById,
  deleteUpdateById
} from '../services/updates.js'

async function update(fastify, options) {
  fastify.get('/api/updates', { preHandler: [verifyToken] }, getUpdates)

  fastify.post('/api/update', { preHandler: [verifyToken] }, newUpdate)

  fastify.put(
    '/api/update/:updateId',
    { preHandler: [verifyToken] },
    updateModifyById
  )

  fastify.delete(
    '/api/update/:updateId',
    { preHandler: [verifyToken] },
    deleteUpdateById
  )
}

export default fastifyPlugin(update)
