import fastifyPlugin from 'fastify-plugin'
import verifyToken from '../middleware/verifyToken.js'
import {
  addItem,
  deleteItem,
  getItem,
  lookUpItems,
  reorderItems,
  updateItem
} from '../services/items.js'
import checkPermission from '../middleware/checkPermission.js'

async function item(fastify, options) {
  fastify.get(
    '/api/items',
    { preHandler: [verifyToken, checkPermission('Sales.Items:view')] },
    getItem
  )
  fastify.get(
    '/api/items/:itemId',
    { preHandler: [verifyToken, checkPermission('Sales.Items:view')] },
    getItem
  )
  fastify.post(
    '/api/items/reorder',
    { preHandler: [verifyToken, checkPermission('Sales.Items:view')] },
    reorderItems
  )
  fastify.post(
    '/api/items',
    { preHandler: [verifyToken, checkPermission('Sales.Items:add')] },
    addItem
  )
  fastify.put(
    '/api/items/:itemId',
    { preHandler: [verifyToken, checkPermission('Sales.Items:edit')] },
    updateItem
  )
  fastify.delete(
    '/api/items/:itemId',
    { preHandler: [verifyToken, checkPermission('Sales.Items:delete')] },
    deleteItem
  )
  fastify.get('/api/items/lookUps', { preHandler: verifyToken }, lookUpItems)
}

export default fastifyPlugin(item)
