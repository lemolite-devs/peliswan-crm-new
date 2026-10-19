import fastifyPlugin from 'fastify-plugin'
import verifyToken from '../middleware/verifyToken.js'
import checkPermission from '../middleware/checkPermission.js'
import {
  getProgress,
  getSalesChartData,
  getSalesTargetWithSalesData,
  getTarget,
  getTargetById,
  updateOrCreateTarget
} from '../services/salesTarget.js'

async function Target(fastify, options) {
  fastify.get('/api/sales-targets', { preHandler: verifyToken }, getTarget)
  fastify.get(
    '/api/sales-targets/:id',
    { preHandler: verifyToken },
    getTargetById
  )
  // fastify.post('/api/sales-targets', { preHandler: verifyToken }, addTarget)
  fastify.put(
    '/api/sales-targets/:id',
    { preHandler: verifyToken },
    updateOrCreateTarget
  )
  fastify.get('/api/sales-progress', { preHandler: verifyToken }, getProgress)
  fastify.get(
    '/api/salesTarget-lookUp',
    { preHandler: verifyToken },
    getSalesTargetWithSalesData
  )
  fastify.get(
    '/api/salesChartData/:id',
    { preHandler: verifyToken },
    getSalesChartData
  )
}
export default fastifyPlugin(Target)
