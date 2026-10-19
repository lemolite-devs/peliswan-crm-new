import fastifyPlugin from 'fastify-plugin'
import exampleRoutes from './exampleRoutes.js'
import users from './users.js'
import leads from './leads.js'
import items from './items.js'
import clients from './clients.js'
import states from './states.js'
import authRoutes from './authRoutes.js'
import roles from './roles.js'
import settings from './settings.js'
import tasks from './tasks.js'
import proposal from './proposal.js'
import announcements from './announcements.js'
import customers from './customers.js'
import salesTarget from './salesTarget.js'
import updates from './updates.js'
import chat from './chat.js'
import notifications from './notifications.js'
import salesHistory from './salesHistory.js'
import transportation from './transportation.js'

async function apiRoutes(fastify, options) {
  // You can add more routes directly here or register additional sub-routes
  fastify.get('/api/', async (request, reply) => {
    reply.send({ message: 'Peliswan CRM is running on port 9000' })
  })
  fastify.register(authRoutes)
  fastify.register(exampleRoutes)
  fastify.register(users)
  fastify.register(leads)
  fastify.register(items)
  fastify.register(clients)
  fastify.register(states)
  fastify.register(roles)
  fastify.register(settings)
  fastify.register(tasks)
  fastify.register(proposal)
  fastify.register(announcements)
  fastify.register(customers)
  fastify.register(salesTarget)
  fastify.register(updates)
  fastify.register(chat)
  fastify.register(notifications)
  fastify.register(salesHistory)
  fastify.register(transportation)
}

export default fastifyPlugin(apiRoutes)
