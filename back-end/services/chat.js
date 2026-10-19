import { Conversation, Message } from '../models/Chat.js'
import Users from '../models/Users.js'
import { storage } from '../config/firebase.js'
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage'
import Joi from 'joi'
import mongoose from 'mongoose'
import { sendNotificationToUsers } from './notifications.js'

// Custom validator for ObjectId
const objectIdValidator = (value, helper) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helper.message({ custom: 'Invalid ObjectId' })
  }
  return value
}

// Validation schemas
const getUserConversationsSchema = Joi.object({
  limit: Joi.number().min(1).max(100).default(20),
  skip: Joi.number().min(0).default(0)
})

const createIndividualChatSchema = Joi.object({
  participantId: Joi.string().custom(objectIdValidator).required().messages({
    'any.required': 'Participant ID is required.',
    'string.empty': 'Participant ID is required.'
  })
})

const createGroupChatSchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    'string.min': 'Group name must be at least 1 character long.',
    'string.max':
      'Group name must be less than or equal to 100 characters long.',
    'any.required': 'Group name is required.',
    'string.empty': 'Group name is required.'
  }),
  description: Joi.string().max(500).optional(),
  participants: Joi.array()
    .items(Joi.string().custom(objectIdValidator))
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one participant is required.',
      'any.required': 'Participants are required.'
    }),
  groupImage: Joi.string().uri().optional()
})

const getConversationMessagesSchema = Joi.object({
  limit: Joi.number().min(1).max(100).default(50),
  skip: Joi.number().min(0).default(0)
})

const sendMessageSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required().messages({
    'string.min': 'Message content must be at least 1 character long.',
    'string.max':
      'Message content must be less than or equal to 1000 characters long.',
    'any.required': 'Message content is required.',
    'string.empty': 'Message content is required.'
  }),
  messageType: Joi.string()
    .valid('text', 'image', 'file', 'audio', 'video')
    .default('text'),
  replyTo: Joi.string().custom(objectIdValidator).optional()
})

const editMessageSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required().messages({
    'string.min': 'Message content must be at least 1 character long.',
    'string.max':
      'Message content must be less than or equal to 1000 characters long.',
    'any.required': 'Message content is required.',
    'string.empty': 'Message content is required.'
  })
})

const searchMessagesSchema = Joi.object({
  q: Joi.string().min(1).required().messages({
    'any.required': 'Search term is required.',
    'string.empty': 'Search term is required.'
  }),
  limit: Joi.number().min(1).max(100).default(20)
})

const addParticipantSchema = Joi.object({
  userId: Joi.string().custom(objectIdValidator).required().messages({
    'any.required': 'User ID is required.',
    'string.empty': 'User ID is required.'
  })
})

// Helper functions

// Upload file to Firebase
const uploadFileToFirebase = async (file, folder = 'chat-files') => {
  try {
    const timestamp = Date.now()
    const fileName = `${folder}/${timestamp}_${file.name}`
    const storageRef = ref(storage, fileName)

    const snapshot = await uploadBytes(storageRef, file.data)
    const downloadURL = await getDownloadURL(snapshot.ref)

    return {
      url: downloadURL,
      fileName: file.name,
      fileSize: file.size
    }
  } catch (error) {
    throw new Error(`Failed to upload file: ${error.message}`)
  }
}

// Delete file from Firebase
const deleteFileFromFirebase = async (fileUrl) => {
  try {
    const fileRef = ref(storage, fileUrl)
    await deleteObject(fileRef)
    return true
  } catch (error) {
    console.error('Failed to delete file from Firebase:', error)
    return false
  }
}

// Mark messages as read (helper function for internal use)
const markMessagesAsRead = async (conversationId, userId) => {
  try {
    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      throw new Error('Conversation not found')
    }

    // Mark conversation as read
    await conversation.markAsRead(userId)

    // Mark all unread messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        'readBy.user': { $ne: userId }
      },
      {
        $push: {
          readBy: {
            user: userId,
            readAt: new Date()
          }
        }
      }
    )

    return true
  } catch (error) {
    throw new Error(`Failed to mark messages as read: ${error.message}`)
  }
}

// GET APIs

// Get user conversations
export const getUserConversations = async (request, reply) => {
  try {
    const { limit = 20, skip = 0 } = request.query
    const userId = request.user.userId

    // Validate query parameters
    const { error } = getUserConversationsSchema.validate({ limit, skip })
    if (error) {
      const errorMessages = error.details.map((err) => err.message)
      return reply
        .code(400)
        .send({ message: 'Validation Error', errors: errorMessages })
    }

    const conversations = await Conversation.findUserConversations(
      userId,
      parseInt(limit),
      parseInt(skip)
    )

    // For individual chats, get the other participant's name
    const conversationsWithNames = await Promise.all(
      conversations.map(async (conversation) => {
        if (conversation.type === 'individual') {
          const otherParticipant = conversation.participants.find(
            (p) => p._id.toString() !== userId.toString()
          )
          conversation.conversationName = otherParticipant
            ? otherParticipant.name
            : 'Unknown User'
        }
        return conversation
      })
    )

    reply.code(200).send({
      message: 'Conversations fetched successfully',
      data: conversationsWithNames
    })
  } catch (error) {
    reply.code(500).send({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

// Get conversation details
export const getConversationDetails = async (request, reply) => {
  try {
    const { conversationId } = request.params
    const userId = request.user.userId

    // Validate conversationId
    const { error } = Joi.object({
      conversationId: Joi.string().custom(objectIdValidator).required()
    }).validate({ conversationId })

    if (error) {
      return reply.code(400).send({ message: 'Invalid conversation ID' })
    }

    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'name userID email')
      .populate('groupAdmin', 'name userID')
      .populate('lastMessage')

    if (!conversation) {
      return reply.code(404).send({ message: 'Conversation not found' })
    }

    if (
      !conversation.participants.some(
        (p) => p._id.toString() === userId.toString()
      )
    ) {
      return reply
        .code(403)
        .send({ message: 'User not authorized to access this conversation' })
    }

    reply.code(200).send({
      message: 'Conversation details fetched successfully',
      data: conversation
    })
  } catch (error) {
    reply.code(500).send({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

// Get conversation messages
export const getConversationMessages = async (request, reply) => {
  try {
    const { conversationId } = request.params
    const { limit = 50, skip = 0 } = request.query
    const userId = request.user.userId

    // Validate parameters
    const { error } = Joi.object({
      conversationId: Joi.string().custom(objectIdValidator).required(),
      limit: Joi.number().min(1).max(100).default(50),
      skip: Joi.number().min(0).default(0)
    }).validate({
      conversationId,
      limit: parseInt(limit),
      skip: parseInt(skip)
    })

    if (error) {
      const errorMessages = error.details.map((err) => err.message)
      return reply
        .code(400)
        .send({ message: 'Validation Error', errors: errorMessages })
    }

    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return reply.code(404).send({ message: 'Conversation not found' })
    }

    if (!conversation.participants.includes(userId)) {
      return reply
        .code(403)
        .send({ message: 'User not authorized to access this conversation' })
    }

    // Mark messages as read
    await markMessagesAsRead(conversationId, userId)

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name userID email')
      .populate('replyTo')
      .populate('readBy.user', 'name userID')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))

    reply.code(200).send({
      message: 'Messages fetched successfully',
      data: messages.reverse()
    })
  } catch (error) {
    reply.code(500).send({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

// Search messages
export const searchMessages = async (request, reply) => {
  try {
    const { conversationId } = request.params
    const { q: searchTerm, limit = 20 } = request.query
    const userId = request.user.userId

    // Validate parameters
    const { error } = Joi.object({
      conversationId: Joi.string().custom(objectIdValidator).required(),
      ...searchMessagesSchema.describe().keys
    }).validate({ conversationId, q: searchTerm, limit })

    if (error) {
      const errorMessages = error.details.map((err) => err.message)
      return reply
        .code(400)
        .send({ message: 'Validation Error', errors: errorMessages })
    }

    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return reply.code(404).send({ message: 'Conversation not found' })
    }

    if (!conversation.participants.includes(userId)) {
      return reply
        .code(403)
        .send({ message: 'User not authorized to access this conversation' })
    }

    const messages = await Message.find({
      conversation: conversationId,
      content: { $regex: searchTerm, $options: 'i' }
    })
      .populate('sender', 'name userID email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))

    reply.code(200).send({
      message: 'Search results fetched successfully',
      data: messages
    })
  } catch (error) {
    reply.code(500).send({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

// Get online users
export const getOnlineUsers = async (request, reply) => {
  try {
    const userId = request.user.userId

    const user = await Users.findById(userId)
    if (!user) {
      return reply.code(404).send({ message: 'User not found' })
    }

    // This will be populated by Socket.IO connection tracking
    // For now, return all users except the current user
    const users = await Users.find({ _id: { $ne: userId } })
      .select('name userID email')
      .limit(50)

    reply.code(200).send({
      message: 'Online users fetched successfully',
      data: users
    })
  } catch (error) {
    reply.code(500).send({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

// POST APIs

// Create individual chat
export const createIndividualChat = async (request, reply) => {
  try {
    const { participantId } = request.body
    const userId = request.user.userId

    // Validate request body
    const { error } = createIndividualChatSchema.validate({ participantId })
    if (error) {
      const errorMessages = error.details.map((err) => err.message)
      return reply
        .code(400)
        .send({ message: 'Validation Error', errors: errorMessages })
    }

    const conversation = await Conversation.findOrCreateIndividualChat(
      userId,
      participantId
    )

    reply.code(201).send({
      message: 'Individual chat created successfully',
      data: conversation
    })
  } catch (error) {
    reply.code(500).send({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

// Create group chat
export const createGroupChat = async (request, reply) => {
  try {
    const { name, description, participants, groupImage } = request.body
    const adminId = request.user.userId

    // Validate request body
    const { error } = createGroupChatSchema.validate({
      name,
      description,
      participants,
      groupImage
    })
    if (error) {
      const errorMessages = error.details.map((err) => err.message)
      return reply
        .code(400)
        .send({ message: 'Validation Error', errors: errorMessages })
    }

    const conversation = new Conversation({
      type: 'group',
      participants: [...participants, adminId],
      groupName: name,
      groupDescription: description,
      groupAdmin: adminId,
      groupImage
    })

    await conversation.save()

    reply.code(201).send({
      message: 'Group chat created successfully',
      data: conversation
    })
  } catch (error) {
    reply.code(500).send({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

// Send message
export const sendMessage = async (request, reply) => {
  try {
    const { conversationId } = request.params
    const { content, messageType = 'text', replyTo } = request.body
    const senderId = request.user.userId

    // Validate parameters
    const { error } = Joi.object({
      conversationId: Joi.string().custom(objectIdValidator).required(),
      ...sendMessageSchema.describe().keys
    }).validate({ conversationId, content, messageType, replyTo })

    if (error) {
      const errorMessages = error.details.map((err) => err.message)
      return reply
        .code(400)
        .send({ message: 'Validation Error', errors: errorMessages })
    }

    const message = new Message({
      conversation: conversationId,
      sender: senderId,
      content,
      messageType,
      replyTo
    })

    await message.save()

    // Update conversation
    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return reply.code(404).send({ message: 'Conversation not found' })
    }

    conversation.lastMessage = message._id
    conversation.lastMessageAt = new Date()

    // Increment unread count for all participants except sender
    conversation.participants.forEach((participantId) => {
      if (participantId.toString() !== senderId.toString()) {
        conversation.incrementUnreadCount(participantId)
      }
    })

    await conversation.save()

    // Send notification to all participants except the sender
    const sender = await Users.findById(senderId).select('name')

    await sendNotificationToUsers(
      conversation.participants.filter(
        (p) => p.toString() !== senderId.toString()
      ),
      {
        title: `${sender?.name || 'Someone'} sent a message`,
        body: content,
        type: 'chat',
        data: {
          conversationId: conversationId.toString(),
          messageId: message._id.toString(),
          senderId: senderId.toString(),
          messageType: messageType,
          url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/chat/${senderId.toString()}`
        }
      }
    )

    reply.code(201).send({
      message: 'Message sent successfully',
      data: message
    })
  } catch (error) {
    reply.code(500).send({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

// Upload file and send message
export const uploadFileAndSendMessage = async (request, reply) => {
  try {
    const { conversationId } = request.params
    const { content, messageType = 'file', replyTo } = request.body
    const senderId = request.user.userId

    // Validate conversationId
    const { error } = Joi.object({
      conversationId: Joi.string().custom(objectIdValidator).required()
    }).validate({ conversationId })

    if (error) {
      return reply.code(400).send({ message: 'Invalid conversation ID' })
    }

    const file = await request.file()
    if (!file) {
      return reply.code(400).send({ message: 'File is required' })
    }

    // Upload file to Firebase
    const fileData = await uploadFileToFirebase(file)

    const messageData = {
      content: content || fileData.fileName,
      messageType,
      fileUrl: fileData.url,
      fileName: fileData.fileName,
      fileSize: fileData.fileSize,
      replyTo
    }

    const message = new Message({
      conversation: conversationId,
      sender: senderId,
      ...messageData
    })

    await message.save()

    // Update conversation
    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return reply.code(404).send({ message: 'Conversation not found' })
    }

    conversation.lastMessage = message._id
    conversation.lastMessageAt = new Date()

    // Increment unread count for all participants except sender
    conversation.participants.forEach((participantId) => {
      if (participantId.toString() !== senderId.toString()) {
        conversation.incrementUnreadCount(participantId)
      }
    })

    await conversation.save()

    // Send notification to all participants except the sender
    const sender = await Users.findById(senderId).select('name')
    await sendNotificationToUsers(
      conversation.participants.filter(
        (p) => p.toString() !== senderId.toString()
      ),
      {
        title: `${sender?.name || 'Someone'} sent a file`,
        body: `${fileData.fileName}`,
        type: 'chat',
        data: {
          conversationId: conversationId.toString(),
          messageId: message._id.toString(),
          senderId: senderId.toString(),
          messageType: messageType,
          url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/chat/${senderId.toString()}`
        }
      }
    )

    reply.code(201).send({
      message: 'File message sent successfully',
      data: message
    })
  } catch (error) {
    reply.code(500).send({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

// Mark messages as read
export const markMessagesAsReadChat = async (request, reply) => {
  try {
    const { conversationId } = request.params
    const userId = request.user.userId

    // Validate conversationId
    const { error } = Joi.object({
      conversationId: Joi.string().custom(objectIdValidator).required()
    }).validate({ conversationId })

    if (error) {
      return reply.code(400).send({ message: 'Invalid conversation ID' })
    }

    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return reply.code(404).send({ message: 'Conversation not found' })
    }

    // Mark conversation as read
    await conversation.markAsRead(userId)

    // Mark all unread messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        'readBy.user': { $ne: userId }
      },
      {
        $push: {
          readBy: {
            user: userId,
            readAt: new Date()
          }
        }
      }
    )

    reply.code(200).send({
      message: 'Messages marked as read successfully'
    })
  } catch (error) {
    reply.code(500).send({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

// Add participant to group
export const addParticipantToGroup = async (request, reply) => {
  try {
    const { conversationId } = request.params
    const { userId } = request.body
    const adminId = request.user.userId

    // Validate parameters
    const { error } = Joi.object({
      conversationId: Joi.string().custom(objectIdValidator).required(),
      ...addParticipantSchema.describe().keys
    }).validate({ conversationId, userId })

    if (error) {
      const errorMessages = error.details.map((err) => err.message)
      return reply
        .code(400)
        .send({ message: 'Validation Error', errors: errorMessages })
    }

    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return reply.code(404).send({ message: 'Conversation not found' })
    }

    if (conversation.type !== 'group') {
      return reply
        .code(400)
        .send({ message: 'Can only add participants to group chats' })
    }

    if (conversation.groupAdmin.toString() !== adminId.toString()) {
      return reply
        .code(403)
        .send({ message: 'Only group admin can add participants' })
    }

    await conversation.addParticipant(userId)

    reply.code(200).send({
      message: 'Participant added successfully',
      data: conversation
    })
  } catch (error) {
    reply.code(500).send({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

// PUT APIs

// Edit message
export const editMessage = async (request, reply) => {
  try {
    const { messageId } = request.params
    const { content } = request.body
    const userId = request.user.userId

    // Validate parameters
    const { error } = Joi.object({
      messageId: Joi.string().custom(objectIdValidator).required(),
      ...editMessageSchema.describe().keys
    }).validate({ messageId, content })

    if (error) {
      const errorMessages = error.details.map((err) => err.message)
      return reply
        .code(400)
        .send({ message: 'Validation Error', errors: errorMessages })
    }

    const message = await Message.findById(messageId)
    if (!message) {
      return reply.code(404).send({ message: 'Message not found' })
    }

    if (message.sender.toString() !== userId.toString()) {
      return reply
        .code(403)
        .send({ message: 'User not authorized to edit this message' })
    }

    message.content = content
    message.isEdited = true
    message.editedAt = new Date()

    await message.save()

    reply.code(200).send({
      message: 'Message edited successfully',
      data: message
    })
  } catch (error) {
    reply.code(500).send({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

// DELETE APIs

// Delete message
export const deleteMessage = async (request, reply) => {
  try {
    const { messageId } = request.params
    const userId = request.user.userId

    // Validate messageId
    const { error } = Joi.object({
      messageId: Joi.string().custom(objectIdValidator).required()
    }).validate({ messageId })

    if (error) {
      return reply.code(400).send({ message: 'Invalid message ID' })
    }

    const message = await Message.findById(messageId)
    if (!message) {
      return reply.code(404).send({ message: 'Message not found' })
    }

    if (message.sender.toString() !== userId.toString()) {
      return reply
        .code(403)
        .send({ message: 'User not authorized to delete this message' })
    }

    // Delete file from Firebase if exists
    if (message.fileUrl) {
      await deleteFileFromFirebase(message.fileUrl)
    }

    await Message.findByIdAndDelete(messageId)

    reply.code(200).send({
      message: 'Message deleted successfully'
    })
  } catch (error) {
    reply.code(500).send({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

// Remove participant from group
export const removeParticipantFromGroup = async (request, reply) => {
  try {
    const { conversationId, userId } = request.params
    const adminId = request.user.userId

    // Validate parameters
    const { error } = Joi.object({
      conversationId: Joi.string().custom(objectIdValidator).required(),
      userId: Joi.string().custom(objectIdValidator).required()
    }).validate({ conversationId, userId })

    if (error) {
      return reply.code(400).send({ message: 'Invalid parameters' })
    }

    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return reply.code(404).send({ message: 'Conversation not found' })
    }

    if (conversation.type !== 'group') {
      return reply
        .code(400)
        .send({ message: 'Can only remove participants from group chats' })
    }

    if (conversation.groupAdmin.toString() !== adminId.toString()) {
      return reply
        .code(403)
        .send({ message: 'Only group admin can remove participants' })
    }

    await conversation.removeParticipant(userId)

    reply.code(200).send({
      message: 'Participant removed successfully',
      data: conversation
    })
  } catch (error) {
    reply.code(500).send({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

// Socket.IO helper functions (for internal use)

// Create individual chat (for Socket.IO)
export const createIndividualChatSocket = async (user1Id, user2Id) => {
  try {
    const conversation = await Conversation.findOrCreateIndividualChat(
      user1Id,
      user2Id
    )
    return conversation
  } catch (error) {
    throw new Error(`Failed to create individual chat: ${error.message}`)
  }
}

// Create group chat (for Socket.IO)
export const createGroupChatSocket = async (groupData) => {
  try {
    const { name, description, adminId, participants, groupImage } = groupData

    const conversation = new Conversation({
      type: 'group',
      participants: [...participants, adminId],
      groupName: name,
      groupDescription: description,
      groupAdmin: adminId,
      groupImage
    })

    await conversation.save()
    return conversation
  } catch (error) {
    throw new Error(`Failed to create group chat: ${error.message}`)
  }
}

// Mark messages as read (for Socket.IO - no reply object needed)
export const markMessagesAsReadSocket = async (conversationId, userId) => {
  try {
    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      throw new Error('Conversation not found')
    }

    // Mark conversation as read using atomic operation
    await Conversation.markAsReadAtomic(conversationId, userId)

    // Mark all unread messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        'readBy.user': { $ne: userId }
      },
      {
        $push: {
          readBy: {
            user: userId,
            readAt: new Date()
          }
        }
      }
    )

    return true
  } catch (error) {
    throw new Error(`Failed to mark messages as read: ${error.message}`)
  }
}

// Send message (for Socket.IO)
export const sendMessageSocket = async (
  conversationId,
  senderId,
  messageData
) => {
  try {
    const {
      content,
      messageType = 'text',
      fileUrl,
      fileName,
      fileSize,
      replyTo
    } = messageData

    const message = new Message({
      conversation: conversationId,
      sender: senderId,
      content,
      messageType,
      fileUrl,
      fileName,
      fileSize,
      replyTo
    })

    await message.save()

    // First, get the conversation to know the participants
    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      throw new Error('Conversation not found')
    }

    // Build the increment object for unread counts
    const unreadCountIncrements = {}
    conversation.participants.forEach((participantId) => {
      if (participantId.toString() !== senderId.toString()) {
        unreadCountIncrements[`unreadCount.${participantId}`] = 1
      }
    })

    // Update conversation using findOneAndUpdate to avoid concurrency issues
    const updatedConversation = await Conversation.findOneAndUpdate(
      { _id: conversationId },
      {
        $set: {
          lastMessage: message._id,
          lastMessageAt: new Date()
        },
        $inc: unreadCountIncrements
      },
      { new: true }
    )

    if (!updatedConversation) {
      throw new Error('Failed to update conversation')
    }

    // Send FCM notification to all participants except the sender
    const otherParticipants = conversation.participants.filter(
      (p) => p.toString() !== senderId.toString()
    )

    if (otherParticipants.length > 0) {
      const sender = await Users.findById(senderId).select('name')
      const notificationTitle =
        messageType === 'file'
          ? `${sender?.name || 'Someone'} sent a file`
          : `${sender?.name || 'Someone'} sent a message`
      const notificationBody =
        messageType === 'file' ? fileName || 'File' : content

      console.log('539 :>', otherParticipants)

      await sendNotificationToUsers(otherParticipants, {
        title: notificationTitle,
        body: notificationBody,
        type: 'chat',
        data: {
          conversationId: conversationId.toString(),
          messageId: message._id.toString(),
          senderId: senderId.toString(),
          messageType: messageType,
          url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/chat/${senderId.toString()}`
        }
      })
    }

    return message
  } catch (error) {
    throw new Error(`Failed to send message: ${error.message}`)
  }
}

// Upload file to Firebase (for Socket.IO)
export const uploadFileToFirebaseSocket = async (
  fileData,
  folder = 'chat-files'
) => {
  try {
    const timestamp = Date.now()
    const fileName = `${folder}/${timestamp}_${fileData.name}`
    const storageRef = ref(storage, fileName)

    const snapshot = await uploadBytes(storageRef, fileData.data)
    const downloadURL = await getDownloadURL(snapshot.ref)

    return {
      url: downloadURL,
      fileName: fileData.name,
      fileSize: fileData.size
    }
  } catch (error) {
    throw new Error(`Failed to upload file: ${error.message}`)
  }
}
