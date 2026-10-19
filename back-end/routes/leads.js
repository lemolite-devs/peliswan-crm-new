import {
  addActivity,
  addLead,
  addNotification,
  deleteActivity,
  deleteLead,
  deleteNotification,
  getLeadById,
  getLeadData,
  updateActivity,
  updateLead,
  updateNotification,
  convertToCustomer,
  getActivityByLeadId,
  getAllReminders,
  getAllActivities,
  getLeadActivityGraphData,
  addGstDetails,
  addBillingAndShippingAddress,
  updateGstDetails,
  updateBillingAndShippingAddress,
  transferLeads,
  existsMobileInLeads,
  markReminderAsRead,
  importLeads
} from '../services/leads.js'
import fastifyPlugin from 'fastify-plugin'
import verifyToken from '../middleware/verifyToken.js'
import checkPermission from '../middleware/checkPermission.js'

async function lead(fastify, options) {
  // fastify.get(
  //   '/api/leads',
  //   { preHandler: [verifyToken, allowedRoles(['Admin'])] },
  //   getLeadData
  // ) // how can we use more then one middleware in the api and filter in middleware

  fastify.get(
    '/api/leads',
    { preHandler: [verifyToken, checkPermission('Leads:view')] },
    getLeadData
  )
  fastify.get(
    '/api/leads/:leadId',
    { preHandler: [verifyToken, checkPermission('Leads:view')] },
    getLeadById
  )
  fastify.get(
    '/api/leads/exists-by-mobile',
    { preHandler: [verifyToken, checkPermission('Leads:view')] },
    existsMobileInLeads
  )
  fastify.post(
    '/api/leads',
    { preHandler: [verifyToken, checkPermission('Leads:add')] },
    addLead
  )
  fastify.delete(
    '/api/leads/:leadId',
    { preHandler: [verifyToken, checkPermission('Leads:delete')] },
    deleteLead
  )
  fastify.put(
    '/api/leads/:leadId',
    { preHandler: [verifyToken, checkPermission('Leads:edit')] },
    updateLead
  )

  fastify.post(
    '/api/leads/:leadId/gst-details',
    {
      preHandler: [verifyToken, checkPermission('Leads:edit')]
    },
    addGstDetails
  )
  fastify.put(
    '/api/leads/:leadId/gst-details',
    {
      preHandler: [verifyToken, checkPermission('Leads:edit')]
    },
    updateGstDetails
  )
  fastify.post(
    '/api/leads/:leadId/addresses',
    {
      preHandler: [verifyToken, checkPermission('Leads:edit')]
    },
    addBillingAndShippingAddress
  )
  fastify.put(
    '/api/leads/:leadId/addresses',
    {
      preHandler: [verifyToken, checkPermission('Leads:edit')]
    },
    updateBillingAndShippingAddress
  )

  fastify.post(
    '/api/leads/:leadId/reminder',
    { preHandler: [verifyToken, checkPermission('Leads:edit')] },
    addNotification
  )
  fastify.delete(
    '/api/leads/:leadId/reminder/:reminderId',
    { preHandler: [verifyToken, checkPermission('Leads:edit')] },
    deleteNotification
  )
  fastify.put(
    '/api/leads/:leadId/reminder/:reminderId',
    { preHandler: [verifyToken, checkPermission('Leads:edit')] },
    updateNotification
  )
  fastify.patch(
    '/api/leads/reminder/:reminderId/mark-read',
    { preHandler: [verifyToken, checkPermission('Leads:edit')] },
    markReminderAsRead
  )
  fastify.post(
    '/api/leads/:leadId/convert-to-customer',
    { preHandler: [verifyToken, checkPermission('Leads:view')] },
    convertToCustomer
  )

  fastify.post(
    '/api/leads/:leadId/activity',
    { preHandler: [verifyToken, checkPermission('Leads:edit')] },
    addActivity
  )

  fastify.get(
    '/api/leads/activities',
    { preHandler: [verifyToken, checkPermission('Leads:view')] },
    getAllActivities
  )

  fastify.get(
    '/api/leads/:leadId/activity',
    { preHandler: [verifyToken, checkPermission('Leads:view')] },
    getActivityByLeadId
  )
  fastify.put(
    '/api/leads/:leadId/activity/:activityId',
    { preHandler: [verifyToken, checkPermission('Leads:edit')] },
    updateActivity
  )
  fastify.delete(
    '/api/leads/:leadId/activity/:activityId',
    { preHandler: [verifyToken, checkPermission('Leads:edit')] },
    deleteActivity
  )

  fastify.get(
    '/api/leads/reminders',
    { preHandler: [verifyToken, checkPermission('Leads:view')] },
    getAllReminders
  )

  fastify.get(
    '/api/leads/activity-graph',
    { preHandler: verifyToken },
    getLeadActivityGraphData
  )

  fastify.post('/api/transfer-lead', { preHandler: verifyToken }, transferLeads)

  fastify.post('/api/leads/import-lead', importLeads)
}

export default fastifyPlugin(lead)
