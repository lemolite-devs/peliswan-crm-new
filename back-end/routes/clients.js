import fastifyPlugin from 'fastify-plugin'
import verifyToken from '../middleware/verifyToken.js'
import {
  addClient,
  deleteClient,
  getClients,
  getClientById,
  updateClientDetails
} from '../services/clients.js'
import checkPermission from '../middleware/checkPermission.js'

async function client(fastify, options) {
  fastify.get(
    '/api/clients',
    { preHandler: [verifyToken, checkPermission('Customers:view')] },
    getClients
  )
  fastify.get(
    '/api/clients/:clientId',
    { preHandler: [verifyToken, checkPermission('Customers:view')] },
    getClientById
  )
  fastify.post(
    '/api/clients',
    { preHandler: [verifyToken, checkPermission('Customers:add')] },
    addClient
  )
  fastify.put(
    '/api/clients/:clientId',
    { preHandler: [verifyToken, checkPermission('Customers:edit')] },
    updateClientDetails
  )
  fastify.delete(
    '/api/clients/:clientId',
    { preHandler: [verifyToken, checkPermission('Customers:delete')] },
    deleteClient
  )
  // fastify.get(
  //   '/api/clients/lookUps',
  //   { preHandler: verifyToken },
  //   lookUpClients
  // )
}

export default fastifyPlugin(client)
