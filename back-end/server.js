// server.js
import Fastify from 'fastify'
import exampleRoutes from './routes/exampleRoutes.js'
import errorHandler from './middleware/errorHandler.js'
import fastifyHelmet from '@fastify/helmet'
import fastifyCors from '@fastify/cors'
import fastifyRateLimit from '@fastify/rate-limit'
import path from 'path'
import fastifyStatic from '@fastify/static'
import dotenv from 'dotenv'
import db from './config/connectDb.js'
import apiRoutes from './routes/apiRoutes.js'
import fastifyCookie from '@fastify/cookie'
import authRoutes from './routes/authRoutes.js'
import fastifyMultipart from '@fastify/multipart'
import fastifySocketIO from 'fastify-socket.io'
import { getAllLeadOverviewData } from './services/leads.js'
import { Conversation } from './models/Chat.js'
import {
  createIndividualChatSocket,
  createGroupChatSocket,
  sendMessageSocket,
  uploadFileToFirebaseSocket,
  markMessagesAsReadSocket
} from './services/chat.js'

const fastify = Fastify({ logger: false, bodyLimit: 30 * 1024 * 1024 })

// Load the environment variables from the appropriate .env file
dotenv.config()
fastify.register(fastifyCookie)

// connect database
fastify.register(db)
// Register routes
fastify.register(apiRoutes)
fastify.register(fastifyMultipart, {
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB file size limit,
    files: 1
  }
})

fastify.register(fastifySocketIO)

let onlineUsers = []
let userRooms = new Map() // Track which rooms each user is in
let lastSeenTimes = new Map() // Track when users were last seen
let userConnections = new Map() // Track multiple connections per user

// Function to broadcast online users to all clients
const broadcastOnlineUsers = () => {
  // Create a unique list of online users (one entry per user, not per connection)
  const uniqueOnlineUsers = Array.from(userConnections.keys()).map((userId) => {
    const connections = userConnections.get(userId)
    return {
      userId,
      socketIds: Array.from(connections.keys()),
      role: connections.values().next().value.role // Get role from first connection
    }
  })

  console.log(
    'Broadcasting online users:',
    uniqueOnlineUsers.map((u) => ({
      userId: u.userId,
      connections: u.socketIds.length
    }))
  )
  fastify.io.emit('online_users_updated', uniqueOnlineUsers)
}

// Function to get online status for a user
const getUserOnlineStatus = (userId) => {
  return userConnections.has(userId) ? 'online' : 'offline'
}

// Function to get last seen time for a user
const getUserLastSeen = (userId) => {
  return lastSeenTimes.get(userId) || null
}

fastify.ready((err) => {
  if (err) throw err // If there's an error during setup, throw it to stop the server.

  // Listen for new connections from clients
  fastify.io.on('connection', (socket) => {
    // Handle user login with role and userId
    socket.on('user_connected', async ({ userId, role }) => {
      try {
        // Store user info in socket for easy access
        socket.userId = userId
        socket.userRole = role

        // Track this connection for the user
        if (!userConnections.has(userId)) {
          userConnections.set(userId, new Map())
        }
        userConnections
          .get(userId)
          .set(socket.id, { role, connectedAt: new Date() })

        // Join user to their personal room
        socket.join(`user_${userId}`)

        // Fetch the leads overview data from the database
        const leadsOverview = await getAllLeadOverviewData()
        socket.emit('leads_overview', leadsOverview)

        // Broadcast updated online users list
        broadcastOnlineUsers()
      } catch (error) {
        console.error('Error in user_connected:', error)
      }
    })

    // Heartbeat to keep connections alive
    socket.on('ping', () => {
      socket.emit('pong')
    })

    // Get current online users
    socket.on('get_online_users', () => {
      try {
        const uniqueOnlineUsers = Array.from(userConnections.keys()).map(
          (userId) => {
            const connections = userConnections.get(userId)
            return {
              userId,
              socketIds: Array.from(connections.keys()),
              role: connections.values().next().value.role
            }
          }
        )
        socket.emit('online_users_updated', uniqueOnlineUsers)
      } catch (error) {
        console.error('Error getting online users:', error)
      }
    })

    // Get online status for specific users
    socket.on('get_user_status', ({ userIds }) => {
      try {
        const statuses = userIds.map((userId) => ({
          userId,
          status: getUserOnlineStatus(userId),
          lastSeen: getUserLastSeen(userId)
        }))
        socket.emit('user_statuses', { statuses })
      } catch (error) {
        console.error('Error getting user statuses:', error)
      }
    })

    // Join chat room
    socket.on('join_room', async ({ conversationId, userId }) => {
      try {
        // Verify user has access to this conversation
        const conversation = await Conversation.findById(conversationId)
          .populate('participants', 'name userID email')
          .populate('groupAdmin', 'name userID')
          .populate('lastMessage')

        if (
          conversation &&
          conversation.participants.some(
            (p) => p._id.toString() === userId.toString()
          )
        ) {
          const roomName = `room_${conversationId}`
          socket.join(roomName)

          // Track user's rooms
          if (!userRooms.has(userId)) {
            userRooms.set(userId, new Set())
          }
          userRooms.get(userId).add(conversationId)

          // Mark messages as read when joining room
          try {
            await markMessagesAsReadSocket(conversationId, userId)
          } catch (markReadError) {
            console.error('Error marking messages as read:', markReadError)
            // Don't fail the room join if marking as read fails
          }

          socket.emit('room_joined', { conversationId })
          console.log(`User ${userId} joined room ${conversationId}`)
        } else {
          socket.emit('room_join_error', {
            message: 'Conversation not found or access denied'
          })
        }
      } catch (error) {
        console.error('Error joining room:', error)
        socket.emit('room_join_error', { message: error.message })
      }
    })

    // Leave chat room
    socket.on('leave_room', ({ conversationId, userId }) => {
      socket.leave(`room_${conversationId}`)

      // Remove from user's rooms tracking
      if (userRooms.has(userId)) {
        userRooms.get(userId).delete(conversationId)
      }

      socket.emit('room_left', { conversationId })
      console.log(`User ${userId} left room ${conversationId}`)
    })

    // Send message
    socket.on(
      'send_message',
      async ({ conversationId, content, messageType = 'text', replyTo }) => {
        try {
          const userId = socket.userId
          if (!userId) {
            socket.emit('message_error', { message: 'User not authenticated' })
            return
          }

          // Check if user is in the room
          const userRoomsSet = userRooms.get(userId)
          if (!userRoomsSet || !userRoomsSet.has(conversationId)) {
            // Try to join the room
            socket.join(`room_${conversationId}`)

            // Track user's rooms
            if (!userRooms.has(userId)) {
              userRooms.set(userId, new Set())
            }
            userRooms.get(userId).add(conversationId)
          }

          const messageData = {
            content,
            messageType,
            replyTo
          }

          const message = await sendMessageSocket(
            conversationId,
            userId,
            messageData
          )

          // Populate sender info
          const populatedMessage = await message.populate(
            'sender',
            'name userID email'
          )

          // Emit to all users in the room (excluding sender)
          socket.to(`room_${conversationId}`).emit('new_message', {
            conversationId,
            message: populatedMessage
          })

          // Emit to sender for confirmation
          socket.emit('message_sent', { messageId: message._id })
        } catch (error) {
          console.error('Error sending message:', error)
          socket.emit('message_error', { message: error.message })
        }
      }
    )

    // Typing indicator
    socket.on('typing_start', ({ conversationId, userId }) => {
      socket.to(`room_${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        isTyping: true
      })
    })

    socket.on('typing_stop', ({ conversationId, userId }) => {
      socket.to(`room_${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        isTyping: false
      })
    })

    // Mark messages as read
    socket.on('mark_read', async ({ conversationId, userId }) => {
      try {
        await markMessagesAsReadSocket(conversationId, userId)

        // Notify other participants that messages were read
        socket.to(`room_${conversationId}`).emit('messages_read', {
          conversationId,
          userId,
          readAt: new Date()
        })
      } catch (error) {
        console.error('Error marking messages as read:', error)
      }
    })

    // Create individual chat
    socket.on('create_individual_chat', async ({ participantId }) => {
      try {
        const userId = socket.userId
        if (!userId) {
          socket.emit('chat_error', { message: 'User not authenticated' })
          return
        }

        const conversation = await createIndividualChatSocket(
          userId,
          participantId
        )

        // Join both users to the room
        const roomName = `room_${conversation._id}`
        socket.join(roomName)

        // Track user's rooms (same as in join_room)
        if (!userRooms.has(userId)) {
          userRooms.set(userId, new Set())
        }
        userRooms.get(userId).add(conversation._id)

        // Notify the other participant
        fastify.io.to(`user_${participantId}`).emit('new_conversation', {
          conversation
        })

        socket.emit('individual_chat_created', { conversation })
      } catch (error) {
        console.error('Error creating individual chat:', error)
        socket.emit('chat_error', { message: error.message })
      }
    })

    // Create group chat
    socket.on(
      'create_group_chat',
      async ({ name, description, participants, groupImage }) => {
        try {
          const adminId = socket.userId
          if (!adminId) {
            socket.emit('chat_error', { message: 'User not authenticated' })
            return
          }

          const groupData = {
            name,
            description,
            adminId,
            participants,
            groupImage
          }

          const conversation = await createGroupChatSocket(groupData)

          // Join admin to the room
          socket.join(`room_${conversation._id}`)

          // Notify all participants
          participants.forEach((participantId) => {
            fastify.io
              .to(`user_${participantId}`)
              .emit('new_group_conversation', {
                conversation
              })
          })

          socket.emit('group_chat_created', { conversation })
        } catch (error) {
          console.error('Error creating group chat:', error)
          socket.emit('chat_error', { message: error.message })
        }
      }
    )

    // File upload and send
    socket.on(
      'send_file_message',
      async ({ conversationId, content, fileData, replyTo }) => {
        try {
          const userId = socket.userId
          if (!userId) {
            socket.emit('message_error', { message: 'User not authenticated' })
            return
          }

          // Upload file to Firebase
          const fileInfo = await uploadFileToFirebaseSocket(fileData)

          const messageData = {
            content: content || fileInfo.fileName,
            messageType: 'file',
            fileUrl: fileInfo.url,
            fileName: fileInfo.fileName,
            fileSize: fileInfo.fileSize,
            replyTo
          }

          const message = await sendMessageSocket(
            conversationId,
            userId,
            messageData
          )

          // Populate sender info
          const populatedMessage = await message.populate(
            'sender',
            'name userID email'
          )

          // Emit to all users in the room (excluding sender)
          socket.to(`room_${conversationId}`).emit('new_message', {
            conversationId,
            message: populatedMessage
          })

          socket.emit('file_message_sent', { messageId: message._id })
        } catch (error) {
          console.error('Error sending file message:', error)
          socket.emit('message_error', { message: error.message })
        }
      }
    )

    // Update and broadcast new leads overview data
    socket.on('update_leads_overview', async () => {
      // Fetch the updated leads overview data from the database
      const updatedLeadsOverview = await getAllLeadOverviewData()

      // Collect socket IDs of users with admin or sales manager roles
      const targetSocketIds = onlineUsers
        // .filter(
        //   (user) => user.role === 'Admin' || user.role === 'Sales Manager'
        // )
        .map((user) => user.socketId)

      // Emit the updated leads overview data to the targeted users
      if (targetSocketIds.length > 0) {
        fastify.io
          .to(targetSocketIds)
          .emit('leads_overview', updatedLeadsOverview)
      }
    })

    socket.on('transfer_lead', ({ name, toUserId }) => {
      const targetUser = onlineUsers.find((user) => user.userId === toUserId)

      if (targetUser) {
        fastify.io.to(targetUser.socketId).emit('transfer_lead', {
          message: `You have received a new lead from ${name}`,
          name
        })
      }
    })

    // Listen for a 'message' event from the connected client
    socket.on('message', (msg) => {
      console.log('Message received:', msg) // Log the received message.
      // Emit the message to all connected clients
      fastify.io.emit('message', msg)
    })

    // Handle disconnection
    socket.on('disconnect', () => {
      const userId = socket.userId

      if (userId) {
        // Remove this specific connection
        if (userConnections.has(userId)) {
          userConnections.get(userId).delete(socket.id)

          // If no more connections for this user, remove them completely and record last seen
          if (userConnections.get(userId).size === 0) {
            userConnections.delete(userId)
            lastSeenTimes.set(userId, new Date().toISOString())
            console.log(`User ${userId} went offline (no more connections)`)
          } else {
            console.log(
              `User ${userId} disconnected one connection, ${userConnections.get(userId).size} remaining`
            )
          }
        }

        // Remove user from rooms tracking
        if (userRooms.has(userId)) {
          userRooms.delete(userId)
        }
      }

      // Broadcast updated online users list
      broadcastOnlineUsers()

      console.log(`Socket ${socket.id} disconnected`)
    })
  })
})

// Register security plugins with CSP
fastify.register(fastifyHelmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", 'ws://localhost:3000']
      // Add more directives as needed
    }
  }
})
fastify.register(fastifyCors, {
  origin: '*' // Customize this based on your needs
})
fastify.register(fastifyRateLimit, {
  max: 100,
  timeWindow: '1 minute'
})

// Register static file serving
fastify.register(fastifyStatic, {
  root: path.join(process.cwd(), 'public'),
  prefix: '/' // Optional: default '/'
})

// Register routes
fastify.get('/', async (request, reply) => {
  return { message: 'Peliswan CRM is running...' }
})

// // Here is  fastify-websocket
// // this code is worked ....
// fastify.register(import('@fastify/websocket'))

// fastify.register(async function () {
//   fastify.route({
//     method: 'GET',
//     url: '/api/ws',
//     handler: (req, reply) => {
//       // this will handle http requests
//       reply.send({ hello: 'world' })
//     },

//     wsHandler: async (client, req) => {
//       console.log('WebSocket ::>> connection established:')

//       // Start listening to sales changes
//       await listenToSalesChanges(client)

//       // Handle incoming messages from the client
//       client.on('message', (msg) => {
//         console.log('WebSocket ::>> Received message :', msg.toString())

//         fastify.websocketServer.clients.forEach((clientReady) => {
//           if (clientReady.readyState === 1) {
//             // 1 means the connection is open
//             client.send(msg.toString())
//           }
//         })
//       })

//       // Handle connection close
//       client.on('close', () => {
//         console.log('WebSocket ::>> WebSocket connection closed')
//       })

//       // Handle connection errors
//       client.on('error', (error) => {
//         console.error('WebSocket ::>> WebSocket error:', error)
//       })
//     }
//   })
// })

// Register error handler
fastify.setErrorHandler(errorHandler)

// Start the server
const start = async () => {
  try {
    await fastify.listen({
      port: process.env.PORT || 9001,
      host: '0.0.0.0'
    })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()
