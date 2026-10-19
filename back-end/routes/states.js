import fastifyPlugin from 'fastify-plugin'
import { getStates, getCountries } from '../services/states.js'
import verifyToken from '../middleware/verifyToken.js'

async function states(fastify, options) {
  fastify.get('/api/states', { preHandler: verifyToken }, getStates)
  fastify.get('/api/countries', { preHandler: verifyToken }, getCountries)
}

export default fastifyPlugin(states)
