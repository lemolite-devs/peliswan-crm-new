import fastifyPlugin from 'fastify-plugin'
import verifyToken from '../middleware/verifyToken.js'
import allowedRoles from '../middleware/allowedRoles.js'
import { addSetting, getSettings, updateSetting } from '../services/settings.js'

async function setting(fastify, options) {
  fastify.get('/api/settings', { preHandler: verifyToken }, getSettings)
  fastify.post('/api/settings', { preHandler: verifyToken }, addSetting)
  fastify.put('/api/settings/:id', { preHandler: verifyToken }, updateSetting)
}

export default fastifyPlugin(setting)
