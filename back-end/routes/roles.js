import fastifyPlugin from 'fastify-plugin'
import allowedRoles from '../middleware/allowedRoles.js'
import verifyToken from '../middleware/verifyToken.js'
import { getRoles, updateRolePermissions } from '../services/roles.js'
import checkPermission from '../middleware/checkPermission.js'

async function roles(fastify, options) {
  fastify.get(
    '/api/roles',
    {
      preHandler: [verifyToken]
    },
    getRoles
  )
  fastify.put(
    '/api/roles/:id',
    { preHandler: [verifyToken, checkPermission('RolesAndPermissions:edit')] },
    updateRolePermissions
  )
}

export default fastifyPlugin(roles)
