import fastifyPlugin from 'fastify-plugin'
import verifyToken from '../middleware/verifyToken.js'
import {
  uploadExcel,
  getSalesChartData,
  getPieChartData,
  getAllUniqueFilters
} from '../services/salesHistory.js'

async function salesHistory(fastify, options) {
  fastify.post('/api/upload-excel', { preHandler: verifyToken }, uploadExcel)
  fastify.get(
    '/api/chart/sales',
    { preHandler: verifyToken },
    getSalesChartData
  )
  fastify.get('/api/pie/all', { preHandler: verifyToken }, getPieChartData)
  fastify.get(
    '/api/allUniqueFilters',
    { preHandler: verifyToken },
    getAllUniqueFilters
  )
}

export default fastifyPlugin(salesHistory)
