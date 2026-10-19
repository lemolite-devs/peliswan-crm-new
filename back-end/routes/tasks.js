import fastifyPlugin from 'fastify-plugin'
import {
  newTask,
  getAllTasks,
  getTaskById,
  deleteTaskById,
  updateTaskById,
  updateTaskFieldById,
  getAllStatusTasks
} from '../services/tasks.js'
import verifyToken from '../middleware/verifyToken.js'
import checkPermission from '../middleware/checkPermission.js'

async function task(fastify, options) {
  fastify.get(
    '/api/tasks',
    { preHandler: [verifyToken, checkPermission('Tasks:view')] },
    getAllTasks
  )
  fastify.get(
    '/api/tasks/:userId',
    { preHandler: [verifyToken, checkPermission('Tasks:view')] },
    getTaskById
  )
  fastify.get(
    '/api/tasks/status-count',
    { preHandler: [verifyToken, checkPermission('Tasks:view')] },
    getAllStatusTasks
  )
  fastify.post(
    '/api/tasks',
    { preHandler: [verifyToken, checkPermission('Tasks:add')] },
    newTask
  )
  fastify.put(
    '/api/tasks/:userId',
    { preHandler: [verifyToken, checkPermission('Tasks:edit')] },
    updateTaskById
  )
  fastify.delete(
    '/api/tasks/:userId',
    { preHandler: [verifyToken, checkPermission('Tasks:delete')] },
    deleteTaskById
  )
  fastify.patch(
    '/api/tasks/update-field/:userId',
    { preHandler: [verifyToken] },
    updateTaskFieldById
  )
}

export default fastifyPlugin(task)
