import fastifyPlugin from 'fastify-plugin'
import {
  newAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  deleteAnnouncementById,
  updateAnnouncementById,
  getWeeklyAnnouncements,
  markAnnouncementAsRead
} from '../services/announcements.js'
import verifyToken from '../middleware/verifyToken.js'
 
 
async function announcement(fastify, options) {
  fastify.get(
    '/api/announcements',
    { preHandler: [verifyToken] },
    getAllAnnouncements
  )
  fastify.get(
    '/api/announcements/:announcementId',
    { preHandler: [verifyToken] },
    getAnnouncementById
  )
 
  fastify.post(
    '/api/announcements',
    { preHandler: [verifyToken] },
    newAnnouncement
  )
  fastify.put(
    '/api/announcements/:announcementId',
    { preHandler: [verifyToken] },
    updateAnnouncementById
  )
  fastify.delete(
    '/api/announcements/:announcementId',
    { preHandler: [verifyToken] },
    deleteAnnouncementById
  ),
    fastify.get(
      '/api/announcements/weekly-notification',
      { preHandler: [verifyToken] },
      getWeeklyAnnouncements
    ),
    fastify.patch('/api/announcements/mark-as-read', markAnnouncementAsRead)
}
 
export default fastifyPlugin(announcement)