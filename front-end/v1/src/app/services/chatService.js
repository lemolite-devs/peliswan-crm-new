import axiosInstance from 'axiosInstance'

// Chat API Service
export const chatService = {
  // Get user conversations
  getUserConversations: async (limit = 20, skip = 0) => {
    try {
      const response = await axiosInstance.get('/api/chat/conversations', {
        params: { limit, skip }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching conversations:', error)
      throw error
    }
  },

  // Get conversation details
  getConversationDetails: async (conversationId) => {
    try {
      const response = await axiosInstance.get(
        `/api/chat/conversations/${conversationId}`
      )
      return response.data
    } catch (error) {
      console.error('Error fetching conversation details:', error)
      throw error
    }
  },

  // Get conversation messages
  getConversationMessages: async (conversationId, limit = 50, skip = 0) => {
    try {
      const response = await axiosInstance.get(
        `/api/chat/conversations/${conversationId}/messages`,
        {
          params: { limit, skip }
        }
      )
      return response.data
    } catch (error) {
      console.error('Error fetching messages:', error)
      throw error
    }
  },

  // Search messages
  searchMessages: async (conversationId, searchTerm, limit = 20) => {
    try {
      const response = await axiosInstance.get(
        `/api/chat/conversations/${conversationId}/search`,
        {
          params: { q: searchTerm, limit }
        }
      )
      return response.data
    } catch (error) {
      console.error('Error searching messages:', error)
      throw error
    }
  },

  // Get online users
  getOnlineUsers: async () => {
    try {
      const response = await axiosInstance.get('/api/chat/users/online')
      return response.data
    } catch (error) {
      console.error('Error fetching online users:', error)
      throw error
    }
  },

  // Create individual chat
  createIndividualChat: async (participantId) => {
    try {
      const response = await axiosInstance.post(
        '/api/chat/conversations/individual',
        {
          participantId
        }
      )
      return response.data
    } catch (error) {
      console.error('Error creating individual chat:', error)
      throw error
    }
  },

  // Create group chat
  createGroupChat: async (groupData) => {
    try {
      const response = await axiosInstance.post(
        '/api/chat/conversations/group',
        groupData
      )
      return response.data
    } catch (error) {
      console.error('Error creating group chat:', error)
      throw error
    }
  },

  // Send message
  sendMessage: async (conversationId, messageData) => {
    try {
      const response = await axiosInstance.post(
        `/api/chat/conversations/${conversationId}/messages`,
        messageData
      )
      return response.data
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  },

  // Upload file and send message
  uploadFileAndSendMessage: async (conversationId, file, messageData) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('content', messageData.content || '')
      formData.append('messageType', messageData.messageType || 'file')
      if (messageData.replyTo) {
        formData.append('replyTo', messageData.replyTo)
      }

      const response = await axiosInstance.post(
        `/api/chat/conversations/${conversationId}/messages/file`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      return response.data
    } catch (error) {
      console.error('Error uploading file and sending message:', error)
      throw error
    }
  },

  // Mark messages as read
  markMessagesAsRead: async (conversationId) => {
    try {
      const response = await axiosInstance.post(
        `/api/chat/conversations/${conversationId}/read`
      )
      return response.data
    } catch (error) {
      console.error('Error marking messages as read:', error)
      throw error
    }
  },

  // Add participant to group
  addParticipantToGroup: async (conversationId, userId) => {
    try {
      const response = await axiosInstance.post(
        `/api/chat/conversations/${conversationId}/participants`,
        {
          userId
        }
      )
      return response.data
    } catch (error) {
      console.error('Error adding participant to group:', error)
      throw error
    }
  },

  // Edit message
  editMessage: async (messageId, content) => {
    try {
      const response = await axiosInstance.put(
        `/api/chat/messages/${messageId}`,
        {
          content
        }
      )
      return response.data
    } catch (error) {
      console.error('Error editing message:', error)
      throw error
    }
  },

  // Delete message
  deleteMessage: async (messageId) => {
    try {
      const response = await axiosInstance.delete(
        `/api/chat/messages/${messageId}`
      )
      return response.data
    } catch (error) {
      console.error('Error deleting message:', error)
      throw error
    }
  },

  // Remove participant from group
  removeParticipantFromGroup: async (conversationId, userId) => {
    try {
      const response = await axiosInstance.delete(
        `/api/chat/conversations/${conversationId}/participants/${userId}`
      )
      return response.data
    } catch (error) {
      console.error('Error removing participant from group:', error)
      throw error
    }
  }
}

// Socket.IO Chat Events
export const chatSocketEvents = {
  // Join room
  joinRoom: (socket, conversationId, userId) => {
    socket.emit('join_room', { conversationId, userId })
  },

  // Leave room
  leaveRoom: (socket, conversationId, userId) => {
    socket.emit('leave_room', { conversationId, userId })
  },

  // Send message
  sendMessage: (
    socket,
    conversationId,
    content,
    messageType = 'text',
    replyTo = null
  ) => {
    socket.emit('send_message', {
      conversationId,
      content,
      messageType,
      replyTo
    })
  },

  // Send file message
  sendFileMessage: (
    socket,
    conversationId,
    content,
    fileData,
    replyTo = null
  ) => {
    socket.emit('send_file_message', {
      conversationId,
      content,
      fileData,
      replyTo
    })
  },

  // Typing indicators
  startTyping: (socket, conversationId, userId) => {
    socket.emit('typing_start', { conversationId, userId })
  },

  stopTyping: (socket, conversationId, userId) => {
    socket.emit('typing_stop', { conversationId, userId })
  },

  // Mark messages as read
  markRead: (socket, conversationId, userId) => {
    socket.emit('mark_read', { conversationId, userId })
  },

  // Create individual chat
  createIndividualChat: (socket, participantId) => {
    socket.emit('create_individual_chat', { participantId })
  },

  // Create group chat
  createGroupChat: (socket, groupData) => {
    socket.emit('create_group_chat', groupData)
  }
}

// Socket.IO Chat Listeners
export const chatSocketListeners = {
  // Room events
  onRoomJoined: (socket, callback) => {
    socket.on('room_joined', callback)
  },

  onRoomLeft: (socket, callback) => {
    socket.on('room_left', callback)
  },

  onRoomJoinError: (socket, callback) => {
    socket.on('room_join_error', callback)
  },

  // Message events
  onNewMessage: (socket, callback) => {
    socket.on('new_message', callback)
  },

  onMessageSent: (socket, callback) => {
    socket.on('message_sent', callback)
  },

  onMessageError: (socket, callback) => {
    socket.on('message_error', callback)
  },

  onFileMessageSent: (socket, callback) => {
    socket.on('file_message_sent', callback)
  },

  // Typing events
  onUserTyping: (socket, callback) => {
    socket.on('user_typing', callback)
  },

  // Read events
  onMessagesRead: (socket, callback) => {
    socket.on('messages_read', callback)
  },

  // Chat creation events
  onIndividualChatCreated: (socket, callback) => {
    socket.on('individual_chat_created', callback)
  },

  onGroupChatCreated: (socket, callback) => {
    socket.on('group_chat_created', callback)
  },

  onNewConversation: (socket, callback) => {
    socket.on('new_conversation', callback)
  },

  onNewGroupConversation: (socket, callback) => {
    socket.on('new_group_conversation', callback)
  },

  onChatError: (socket, callback) => {
    socket.on('chat_error', callback)
  },

  // Cleanup listeners
  cleanup: (socket) => {
    socket.off('room_joined')
    socket.off('room_left')
    socket.off('room_join_error')
    socket.off('new_message')
    socket.off('message_sent')
    socket.off('message_error')
    socket.off('file_message_sent')
    socket.off('user_typing')
    socket.off('messages_read')
    socket.off('individual_chat_created')
    socket.off('group_chat_created')
    socket.off('new_conversation')
    socket.off('new_group_conversation')
    socket.off('chat_error')
  }
}
