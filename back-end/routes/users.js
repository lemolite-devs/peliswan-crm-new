import fastifyPlugin from 'fastify-plugin'
import {
  deleteUserById,
  getUserById,
  getUsers,
  newUser,
  passwordDecrypt,
  updateUserById,
  lookUpUsers
} from '../services/users.js'
import checkPermission from '../middleware/checkPermission.js'
import verifyToken from '../middleware/verifyToken.js'

async function user(fastify, options) {
  fastify.get(
    '/api/users',
    { preHandler: [verifyToken, checkPermission('Staff:view')] },
    getUsers
  )
  fastify.get('/api/users/:userId', { preHandler: verifyToken }, getUserById)
  fastify.get(
    '/api/users/:userId/decrypt-password',
    { preHandler: [verifyToken, checkPermission('Staff:view')] },
    passwordDecrypt
  )
  fastify.post(
    '/api/users',
    { preHandler: [verifyToken, checkPermission('Staff:add')] },
    newUser
  )
  fastify.put(
    '/api/users/:userId',
    { preHandler: [verifyToken, checkPermission('Staff:edit')] },
    updateUserById
  )
  fastify.delete(
    '/api/users/:userId',
    { preHandler: [verifyToken, checkPermission('Staff:delete')] },
    deleteUserById
  )

  fastify.get('/api/users/lookUps', { preHandler: verifyToken }, lookUpUsers),
    fastify.get(
      '/api/users/filter/lookUps',
      { preHandler: verifyToken },
      getUsers
    )
}

export default fastifyPlugin(user)
