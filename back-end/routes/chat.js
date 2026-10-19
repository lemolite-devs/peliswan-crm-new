import fastifyPlugin from 'fastify-plugin'
import verifyToken from '../middleware/verifyToken.js'
import {
  getUserConversations,
  getConversationDetails,
  getConversationMessages,
  searchMessages,
  getOnlineUsers,
  createIndividualChat,
  createGroupChat,
  sendMessage,
  uploadFileAndSendMessage,
  markMessagesAsReadChat,
  addParticipantToGroup,
  editMessage,
  deleteMessage,
  removeParticipantFromGroup
} from '../services/chat.js'

async function chat(fastify, options) {
  // GET APIs
  fastify.get(
    '/api/chat/conversations',
    { preHandler: verifyToken },
    getUserConversations
  )

  fastify.get(
    '/api/chat/conversations/:conversationId',
    { preHandler: verifyToken },
    getConversationDetails
  )

  fastify.get(
    '/api/chat/conversations/:conversationId/messages',
    { preHandler: verifyToken },
    getConversationMessages
  )

  fastify.get(
    '/api/chat/conversations/:conversationId/search',
    { preHandler: verifyToken },
    searchMessages
  )

  fastify.get(
    '/api/chat/users/online',
    { preHandler: verifyToken },
    getOnlineUsers
  )

  // POST APIs
  fastify.post(
    '/api/chat/conversations/individual',
    { preHandler: verifyToken },
    createIndividualChat
  )

  fastify.post(
    '/api/chat/conversations/group',
    { preHandler: verifyToken },
    createGroupChat
  )

  fastify.post(
    '/api/chat/conversations/:conversationId/messages',
    { preHandler: verifyToken },
    sendMessage
  )

  fastify.post(
    '/api/chat/conversations/:conversationId/messages/file',
    { preHandler: verifyToken },
    uploadFileAndSendMessage
  )

  fastify.post(
    '/api/chat/conversations/:conversationId/read',
    { preHandler: verifyToken },
    markMessagesAsReadChat
  )

  fastify.post(
    '/api/chat/conversations/:conversationId/participants',
    { preHandler: verifyToken },
    addParticipantToGroup
  )

  // PUT APIs
  fastify.put(
    '/api/chat/messages/:messageId',
    { preHandler: verifyToken },
    editMessage
  )

  // DELETE APIs
  fastify.delete(
    '/api/chat/messages/:messageId',
    { preHandler: verifyToken },
    deleteMessage
  )

  fastify.delete(
    '/api/chat/conversations/:conversationId/participants/:userId',
    { preHandler: verifyToken },
    removeParticipantFromGroup
  )
}

export default fastifyPlugin(chat)
