import fastifyPlugin from 'fastify-plugin'
import {
  deleteSaleById,
  getCustomers,
  getChartData,
  newCustomer,
  updateCustomerById,
  getCustomerById,
  lookUpClients,
  lookupCompanyName,
  lookUpCustomers,
  getSalesByUser
} from '../services/customers.js'
import verifyToken from '../middleware/verifyToken.js'
import checkPermission from '../middleware/checkPermission.js'

async function customers(fastify, options) {
  fastify.get(
    '/api/customers',
    { preHandler: [verifyToken, checkPermission('Customers:view')] },
    getCustomers
  )
  fastify.get(
    '/api/customers/:customerId',
    { preHandler: [verifyToken, checkPermission('Customers:view')] },
    getCustomerById
  )
  fastify.get('/api/sales/user/:userId', getSalesByUser)
  fastify.get(
    '/api/customers/charts',
    { preHandler: verifyToken },
    getChartData
  )

  fastify.post(
    '/api/customers',
    { preHandler: [verifyToken, checkPermission('Customers:add')] },
    newCustomer
  )
  fastify.put(
    '/api/customers/:orderId',
    { preHandler: [verifyToken, checkPermission('Customers:edit')] },
    updateCustomerById
  )
  fastify.delete(
    '/api/customers/:customerId',
    { preHandler: [verifyToken, checkPermission('Customers:delete')] },
    deleteSaleById
  )
  fastify.get(
    '/api/clients/lookUps',
    { preHandler: verifyToken },
    lookUpClients
  ),
    fastify.get(
      '/api/company-name/lookups',
      { preHandler: verifyToken },
      lookupCompanyName
    ),
    fastify.get(
      '/api/customers/lookUps',
      { preHandler: verifyToken },
      lookUpCustomers
    )
}

export default fastifyPlugin(customers)
