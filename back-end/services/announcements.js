import { Announcements, Updates } from '../models/index.js'
import mongoose from 'mongoose'
import moment from 'moment'
import Joi from 'joi'

// Define announcement schema for validation
const announcementSchema = Joi.object({
  title: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Title must be at least 3 characters long.',
    'string.max': 'Title can be at most 100 characters long.', // Corrected max length message
    'any.required': 'Title is required.',
    'string.empty': 'Title cannot be empty.'
  }),
  startDate: Joi.date().required().messages({
    'any.required': 'Start Date is required.',
    'date.base': 'Start Date must be a valid date.'
  }),
  endDate: Joi.date().required().messages({
    'any.required': 'End Date is required.',
    'date.base': 'End Date must be a valid date.'
  }),
  description: Joi.string().max(500).allow('').optional().messages({
    'string.max': 'Description can be at most 500 characters long.'
  })
})

// Function to validate announcement data
const validateAnnouncement = (data) =>
  announcementSchema.validate(data, { abortEarly: false })

// Create a new announcement
export const newAnnouncement = async (request, reply) => {
  const { error } = validateAnnouncement(request.body)
  if (error) {
    const errorMessages = error.details.map((err) => err.message)
    return reply
      .code(400)
      .send({ message: 'Validation Error', errors: errorMessages })
  }

  try {
    const announcement = new Announcements({
      ...request.body,
      user: request?.user?.userId
    })
    await announcement.save()
    reply.code(201).send({ success: true, announcement })
  } catch (error) {
    console.error('Error creating announcement:', error)
    reply.code(500).send({ success: false, message: 'Internal Server Error' })
  }
}

// Get all announcements
export const getAllAnnouncements = async (request, reply) => {
  try {
    const date = moment(new Date(), 'D-M-YYYY')
      .tz('UTC')
      .subtract(1, 'days')
      .set({ hour: 18, minute: 30, second: 0, millisecond: 0 })
      .format('YYYY-MM-DDTHH:mm:ss.SSSZ')

    const announcements = await Announcements.find({
      startDate: { $gte: date }
    })
      .select('title startDate endDate description')
      .populate({
        path: 'user',
        select: 'name'
      })
      .sort({ startDate: 1 })

    reply.send({ announcements })
  } catch (error) {
    reply.code(500).send({ message: 'Failed to fetch announcements.' })
  }
}

// Get an announcement by ID
export const getAnnouncementById = async (request, reply) => {
  const { announcementId } = request.params

  if (!mongoose.Types.ObjectId.isValid(announcementId)) {
    return reply.code(400).send({ message: 'Invalid announcement ID format' })
  }

  try {
    const announcement = await Announcements.findById(announcementId).select(
      'title startDate endDate description'
    )

    if (!announcement) {
      return reply.code(404).send({ message: 'Announcement not found' })
    }

    reply
      .code(200)
      .send({ message: 'Announcement data fetched successfully', announcement })
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}

// Delete an announcement by ID
export const deleteAnnouncementById = async (request, reply) => {
  const { announcementId } = request.params

  if (!mongoose.Types.ObjectId.isValid(announcementId)) {
    return reply.code(400).send({ message: 'Invalid announcement ID format.' })
  }

  try {
    const announcement = await Announcements.findByIdAndDelete(announcementId)
    if (!announcement) {
      return reply.code(404).send({ message: 'Announcement not found.' })
    }

    reply.code(200).send({ message: 'Announcement successfully deleted.' })
  } catch (error) {
    reply.code(500).send({ message: 'Failed to delete announcement.' })
  }
}

// Update an announcement by ID
export const updateAnnouncementById = async (request, reply) => {
  const { announcementId } = request.params
  const { error } = validateAnnouncement(request.body)
  if (error) {
    const errorMessages = error.details.map((err) => err.message)
    return reply
      .code(400)
      .send({ message: 'Validation Error', errors: errorMessages })
  }

  try {
    const announcement = await Announcements.findById(announcementId)
    if (!announcement) {
      return reply.code(404).send({ message: 'Announcement not found.' })
    }

    const updatedAnnouncement = await Announcements.findByIdAndUpdate(
      announcementId,
      { ...request.body, user: request?.user?.userId },
      {
        new: true,
        runValidators: true
      }
    )

    reply.code(200).send({
      message: 'Announcement updated successfully',
      updatedAnnouncement
    })
  } catch (error) {
    reply.code(500).send({ message: 'Failed to update announcement.' })
  }
}

// get data from currant date to next 7 days.
export const getWeeklyAnnouncements = async (request, reply) => {
  try {
    // const startDate = moment().startOf('day').toDate() // Current date
    const startDate = moment(new Date(), 'D-M-YYYY')
      .tz('UTC')
      .subtract(1, 'days')
      .set({ hour: 18, minute: 30, second: 0, millisecond: 0 })
      .format('YYYY-MM-DDTHH:mm:ss.SSSZ')

    const endDate = moment().add(7, 'days').endOf('day').toDate() // 7 days later

    const announcements = await Announcements.find({
      startDate: { $gte: startDate, $lte: endDate },
      isRead: false
    })
      .select('title startDate endDate description isRead')
      .sort({ createdAt: -1 })

    // Get recent updates (last 7 days) - only unread ones
    const updates = await Updates.find({
      createdAt: { $gte: moment().subtract(7, 'days').toDate() },
      isRead: false
    })
      .populate({ path: 'updatedBy', select: 'name' })
      .sort({ createdAt: -1 })
      .limit(10)

    // Convert announcements to notification format
    const announcementNotifications = announcements.map((announcement) => ({
      id: announcement._id.toString(),
      heading: 'Event Alert',
      icon: {
        name: 'notifications',
        color: 'info'
      },
      timestamp: announcement.startDate,
      title: announcement.title,
      subtitle: announcement.description,
      path: 'dashboard',
      isRead: announcement.isRead,
      type: 'announcement'
    }))

    // Convert updates to notification format
    const updateNotifications = updates.map((update) => ({
      id: update._id.toString(),
      heading: 'Update Posted',
      icon: {
        name: 'update',
        color: 'info'
      },
      timestamp: update.createdAt,
      title: update.updatedBy.name || 'Unknown User',
      subtitle: update.message,
      path: 'dashboard',
      isRead: update.isRead,
      type: 'update'
    }))

    // Combine and sort all notifications by timestamp
    const allNotifications = [
      ...announcementNotifications,
      ...updateNotifications
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    reply.send({ notifications: allNotifications })
  } catch (error) {
    reply.code(500).send({ message: 'Failed to fetch weekly announcements.' })
  }
}

export const markAnnouncementAsRead = async (request, reply) => {
  try {
    const { id, isRead, type } = request.body

    if (typeof isRead !== 'boolean') {
      return reply.code(400).send({ message: 'isRead must be a boolean.' })
    }

    let result = null
    let message = ''

    if (type === 'update') {
      // Handle update notification
      const update = await Updates.findByIdAndUpdate(
        id,
        { isRead },
        { new: true }
      )

      if (!update) {
        return reply.code(404).send({ message: 'Update not found.' })
      }

      result = update
      message = 'Update read status updated.'
    } else {
      // Handle announcement notification (default behavior)
      const announcement = await Announcements.findByIdAndUpdate(
        id,
        { isRead },
        { new: true }
      )

      if (!announcement) {
        return reply.code(404).send({ message: 'Announcement not found.' })
      }

      result = announcement
      message = 'Announcement read status updated.'
    }

    reply.send({
      message,
      data: result
    })
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Failed to update notification read status.' })
  }
}
