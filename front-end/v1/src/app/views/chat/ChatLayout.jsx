import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  useNavigate,
  useParams,
  Outlet,
  useSearchParams
} from 'react-router-dom'
import {
  Box,
  useTheme,
  useMediaQuery,
  IconButton,
  Typography,
  AppBar,
  Toolbar
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import UserList from './UserList'
import { chatService } from 'app/services/chatService'
import { useSocket } from 'app/contexts/SocketContext'
import useAuth from 'app/hooks/useAuth'
import axiosInstance from 'axiosInstance'
import moment from 'moment'

const ChatLayout = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const { userId: paramUserId } = useParams()
  const [searchParams] = useSearchParams()
  const conversationParam = searchParams.get('conversation')
  const { socket, isConnected } = useSocket()
  const { user: authUser } = useAuth()
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [allUsers, setAllUsers] = useState([])
  const [onlineUsers, setOnlineUsers] = useState([])
  const isCreatingConversation = useRef(false) // Track if we're creating a conversation
  const currentConversationRef = useRef(null) // Track current conversation to prevent unnecessary updates

  // Helper function to save conversation state to localStorage
  const saveConversationState = useCallback(
    (conversationId) => {
      if (conversationId) {
        localStorage.setItem('selectedConversation', conversationId)
        localStorage.setItem('selectedUserId', paramUserId || '')
      } else {
        localStorage.removeItem('selectedConversation')
        localStorage.removeItem('selectedUserId')
      }
    },
    [paramUserId]
  )

  // Helper function to load conversation state from localStorage
  const loadConversationState = useCallback(() => {
    const savedConversation = localStorage.getItem('selectedConversation')
    const savedUserId = localStorage.getItem('selectedUserId')

    if (savedConversation && savedUserId === paramUserId) {
      return savedConversation
    }
    return null
  }, [paramUserId])

  // Helper function to format last seen time
  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Offline'

    const now = new Date()
    const lastSeenDate = new Date(lastSeen)
    const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} hours ago`
    if (diffInMinutes < 2880) return 'Yesterday'
    return `Last seen ${lastSeenDate.toLocaleDateString()}`
  }

  // Fetch all users for starting new conversations
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const response = await axiosInstance.get('/api/users/filter/lookUps')
        const data = response.data?.users || []
        // Filter out current user and map to user format
        const mappedUsers = data
          .filter((user) => user._id !== authUser.id)
          .map((user) => ({
            id: user._id,
            name: user.name,
            avatar: '', // TODO: add avatar if available
            status: 'offline', // Default to offline, will be updated by socket
            lastMessage: '',
            lastMessageTime: '',
            unreadCount: 0,
            conversationId: null, // No existing conversation
            conversationType: null
          }))
        setAllUsers(mappedUsers)
      } catch (err) {
        console.error('Error fetching all users:', err)
        setAllUsers([])
      }
    }
    fetchAllUsers()
  }, [authUser.id])

  // Fetch conversations on mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await chatService.getUserConversations()
        setConversations(res.data)
        // Map conversations to user list for sidebar
        const mappedUsers = res.data.map((conv) => {
          // For individual chats, get the other participant
          let otherUser = null
          if (conv.type === 'individual') {
            otherUser = conv.participants.find((p) => p._id !== authUser.id)
          } else {
            // For group, use groupName and groupImage
            otherUser = {
              _id: conv._id,
              name: conv.conversationName || conv.groupName,
              avatar: conv.groupImage || '',
              status: 'online', // TODO: get real status
              lastMessage: conv.lastMessage?.content || '',
              lastMessageTime: conv.lastMessageAt
                ? moment(conv.lastMessageAt).format('DD MMM YYYY, hh:mm A')
                : '',
              unreadCount: conv.unreadCount?.[authUser.id] || 0
            }
          }
          return {
            id: otherUser._id,
            name: otherUser.name,
            avatar: otherUser.avatar,
            status: otherUser.status,
            lastMessage: conv.lastMessage?.content || '',
            lastMessageTime: conv.lastMessageAt
              ? moment(conv.lastMessageAt).format('DD MMM YYYY, hh:mm A')
              : '',
            unreadCount: conv.unreadCount?.[authUser.id] || 0,
            conversationId: conv._id,
            conversationType: conv.type
          }
        })
        setUsers(mappedUsers)
      } catch (err) {
        console.error('Error fetching conversations:', err)
        setUsers([])
      }
    }
    fetchConversations()
  }, [authUser.id])

  // Handle online users updates
  useEffect(() => {
    if (!socket) return

    const handleOnlineUsersUpdate = (users) => {
      setOnlineUsers(users)
    }

    const handleConnect = () => {
      socket.emit('get_online_users')
    }

    socket.on('online_users_updated', handleOnlineUsersUpdate)
    socket.on('connect', handleConnect)

    // Request current online users if already connected
    if (socket.connected) {
      socket.emit('get_online_users')
    }

    return () => {
      socket.off('online_users_updated', handleOnlineUsersUpdate)
      socket.off('connect', handleConnect)
    }
  }, [socket])

  // Set selected user/conversation when param changes
  useEffect(() => {
    if (paramUserId) {
      // Find user from all available sources
      const userFromUsers = users.find((u) => u.id === paramUserId)
      const userFromAllUsers = allUsers.find((u) => u.id === paramUserId)
      const user = userFromUsers || userFromAllUsers

      if (user) {
        setSelectedUser(user)

        // Try to restore conversation state from localStorage first
        const savedConversation = loadConversationState()
        if (savedConversation && !isCreatingConversation.current) {
          setSelectedConversation(savedConversation)
          currentConversationRef.current = savedConversation
          return
        }

        // Only set selectedConversation if we don't already have a valid one
        // This prevents overwriting during conversation creation or when we already have a conversation
        if (
          !isCreatingConversation.current &&
          !currentConversationRef.current
        ) {
          setSelectedConversation(user.conversationId || null)
          currentConversationRef.current = user.conversationId
          saveConversationState(user.conversationId)
        }
      } else {
      }
    } else {
      // Only clear if we don't have a paramUserId
      setSelectedUser(null)
      setSelectedConversation(null)
      currentConversationRef.current = null
      saveConversationState(null)
    }
  }, [paramUserId, loadConversationState, saveConversationState]) // Add localStorage functions to dependencies

  // Combine existing conversations with all users for complete user list
  const combinedUsers = useCallback(() => {
    const existingUserIds = new Set(users.map((u) => u.id))
    const newUsers = allUsers.filter((user) => !existingUserIds.has(user.id))

    // Merge users with proper status handling
    const mergedUsers = [...users, ...newUsers].map((user) => {
      // Simple check: if user is in onlineUsers array, they are online
      const isOnline = onlineUsers.some(
        (onlineUser) => onlineUser.userId === user.id
      )
      return {
        ...user,
        status: isOnline ? 'online' : 'offline'
      }
    })

    return mergedUsers
  }, [users, allUsers, onlineUsers])

  // Cleanup effect to reset conversation creation flag
  useEffect(() => {
    return () => {
      isCreatingConversation.current = false
    }
  }, [])

  // Cleanup effect to clear localStorage when navigating away
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear localStorage when user navigates away or refreshes
      localStorage.removeItem('selectedConversation')
      localStorage.removeItem('selectedUserId')
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  // Debug selectedConversation changes
  useEffect(() => {
    // Keep ref in sync
    currentConversationRef.current = selectedConversation
    // Save to localStorage
    saveConversationState(selectedConversation)
  }, [selectedConversation, selectedUser, saveConversationState])

  // Fetch messages when selectedConversation changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedConversation) {
        try {
          const res =
            await chatService.getConversationMessages(selectedConversation)
          // Map messages to UI format
          const mappedMessages = res.data.map((msg) => ({
            id: msg._id,
            userId: msg.sender?._id,
            text: msg.content,
            sender: msg.sender?._id === authUser.id ? 'me' : 'other',
            timestamp: moment(msg.createdAt).format('DD MMM YYYY, hh:mm A'),
            user: {
              name: msg.sender?.name || '',
              avatar: '' // TODO: add avatar if available
            }
          }))
          setMessages(mappedMessages)

          // Mark messages as read when conversation is loaded
          try {
            await chatService.markMessagesAsRead(selectedConversation)

            // Update conversations list to reset unread count
            setConversations((prev) =>
              prev.map((conv) =>
                conv._id === selectedConversation
                  ? {
                      ...conv,
                      unreadCount: { ...conv.unreadCount, [authUser.id]: 0 }
                    }
                  : conv
              )
            )

            // Update users list to reset unread count
            setUsers((prev) =>
              prev.map((user) =>
                user.conversationId === selectedConversation
                  ? { ...user, unreadCount: 0 }
                  : user
              )
            )
          } catch (readError) {
            console.error('Error marking messages as read:', readError)
          }
        } catch (err) {
          console.error('Error fetching messages:', err)
          setMessages([])
        }
      } else {
        setMessages([])
      }
    }
    fetchMessages()
  }, [selectedConversation, authUser.id])

  // Join room on socket when conversation changes
  useEffect(() => {
    if (socket && selectedConversation && authUser.id) {
      socket.emit('join_room', {
        conversationId: selectedConversation,
        userId: authUser.id
      })

      // Mark messages as read via socket
      socket.emit('mark_read', {
        conversationId: selectedConversation,
        userId: authUser.id
      })

      // Listen for room join confirmation
      const handleRoomJoined = (data) => {}

      const handleRoomJoinError = (data) => {
        console.error('Failed to join room:', data.message)
        // Retry joining room after a short delay
        setTimeout(() => {
          socket.emit('join_room', {
            conversationId: selectedConversation,
            userId: authUser.id
          })
        }, 1000)
      }

      socket.on('room_joined', handleRoomJoined)
      socket.on('room_join_error', handleRoomJoinError)

      return () => {
        socket.off('room_joined', handleRoomJoined)
        socket.off('room_join_error', handleRoomJoinError)
      }
    }
  }, [socket, selectedConversation, authUser.id])

  // Leave room when component unmounts or conversation changes
  useEffect(() => {
    return () => {
      if (socket && selectedConversation && authUser.id) {
        socket.emit('leave_room', {
          conversationId: selectedConversation,
          userId: authUser.id
        })
      }
    }
  }, [socket, selectedConversation, authUser.id])

  // Handle real-time new messages
  useEffect(() => {
    if (!socket) return
    const handleNewMessage = ({ conversationId, message }) => {
      if (conversationId === selectedConversation) {
        // Check if this message is from the current user (optimistic message replacement)
        const isFromCurrentUser = message.sender._id === authUser.id

        if (isFromCurrentUser) {
          // Replace optimistic message with real message
          setMessages((prev) =>
            prev.map((msg) =>
              msg.isOptimistic
                ? {
                    id: message._id,
                    userId: message.sender._id,
                    text: message.content,
                    sender: 'me',
                    timestamp: moment(message.createdAt).format(
                      'DD MMM YYYY, hh:mm A'
                    ),
                    user: {
                      name: message.sender.name || '',
                      avatar: ''
                    },
                    isOptimistic: false
                  }
                : msg
            )
          )
        } else {
          // Check if this message already exists (to prevent duplicates)
          setMessages((prev) => {
            const messageExists = prev.some((msg) => msg.id === message._id)
            if (messageExists) {
              return prev // Don't add duplicate
            }

            // Add new message from other user
            const newMessage = {
              id: message._id,
              userId: message.sender._id,
              text: message.content,
              sender: 'other',
              timestamp: moment(message.createdAt).format(
                'DD MMM YYYY, hh:mm A'
              ),
              user: {
                name: message.sender.name || '',
                avatar: ''
              }
            }

            return [...prev, newMessage]
          })
        }

        // Update conversation list with new message
        setConversations((prev) =>
          prev.map((conv) =>
            conv._id === conversationId
              ? {
                  ...conv,
                  lastMessage: message,
                  lastMessageAt: message.createdAt
                }
              : conv
          )
        )

        // Update users list with new message
        setUsers((prev) =>
          prev.map((user) =>
            user.conversationId === conversationId
              ? {
                  ...user,
                  lastMessage: message.content,
                  lastMessageTime: moment(message.createdAt).format(
                    'DD MMM YYYY, hh:mm A'
                  )
                }
              : user
          )
        )
      }
    }

    // Handle messages read event
    const handleMessagesRead = ({ conversationId, userId }) => {
      if (userId === authUser.id) {
        // Update conversations list to reset unread count
        setConversations((prev) =>
          prev.map((conv) =>
            conv._id === conversationId
              ? {
                  ...conv,
                  unreadCount: { ...conv.unreadCount, [authUser.id]: 0 }
                }
              : conv
          )
        )

        // Update users list to reset unread count
        setUsers((prev) =>
          prev.map((user) =>
            user.conversationId === conversationId
              ? { ...user, unreadCount: 0 }
              : user
          )
        )
      }
    }

    socket.on('new_message', handleNewMessage)
    socket.on('messages_read', handleMessagesRead)

    return () => {
      socket.off('new_message', handleNewMessage)
      socket.off('messages_read', handleMessagesRead)
    }
  }, [socket, selectedConversation, authUser.id])

  const handleUserSelect = useCallback(
    async (user) => {
      navigate(`/chat/${user.id}`)

      // Set selected user immediately for UI feedback
      setSelectedUser(user)

      try {
        // If user has no existing conversation, create one
        if (!user.conversationId) {
          try {
            // Set flag to indicate we're creating a conversation
            isCreatingConversation.current = true

            const res = await chatService.createIndividualChat(user.id)
            const newConversation = res.data

            // Update the user with the new conversation ID
            const updatedUser = {
              ...user,
              conversationId: newConversation._id,
              conversationType: 'individual'
            }

            // Set both user and conversation immediately
            setSelectedUser(updatedUser)
            setSelectedConversation(newConversation._id)
            currentConversationRef.current = newConversation._id
            saveConversationState(newConversation._id)

            // Update the users list
            setUsers((prev) =>
              prev.map((u) => (u.id === user.id ? updatedUser : u))
            )

            // Add the new conversation to conversations list
            setConversations((prev) => [...prev, newConversation])

            // Explicitly join the socket room for the new conversation
            if (socket && newConversation._id && authUser.id) {
              // Join room via socket
              socket.emit('join_room', {
                conversationId: newConversation._id,
                userId: authUser.id
              })

              // Mark messages as read via socket
              socket.emit('mark_read', {
                conversationId: newConversation._id,
                userId: authUser.id
              })

              // Wait a bit to ensure room joining is processed
              await new Promise((resolve) => setTimeout(resolve, 500))
            }

            // Clear the flag after conversation is created
            isCreatingConversation.current = false

            // Return the conversation ID to ensure it's set
            return newConversation._id
          } catch (apiError) {
            console.error('API Error creating conversation:', apiError)
            isCreatingConversation.current = false
            throw apiError
          }
        } else {
          setSelectedUser(user)
          setSelectedConversation(user.conversationId)
          currentConversationRef.current = user.conversationId
          saveConversationState(user.conversationId)

          // Mark messages as read when selecting an existing conversation
          try {
            await chatService.markMessagesAsRead(user.conversationId)

            // Update the user's unread count to 0
            setUsers((prev) =>
              prev.map((u) => (u.id === user.id ? { ...u, unreadCount: 0 } : u))
            )

            // Update conversations list to reset unread count
            setConversations((prev) =>
              prev.map((conv) =>
                conv._id === user.conversationId
                  ? {
                      ...conv,
                      unreadCount: { ...conv.unreadCount, [authUser.id]: 0 }
                    }
                  : conv
              )
            )
          } catch (readError) {
            console.error('Error marking messages as read:', readError)
            // Don't fail the user selection if marking as read fails
          }

          // Return the conversation ID to ensure it's set
          return user.conversationId
        }
      } catch (err) {
        console.error('Error in handleUserSelect:', err)
        isCreatingConversation.current = false
        // Even if conversation creation fails, we still have the user selected
        // and navigation has already happened
        return null
      }
    },
    [navigate, chatService, authUser, socket]
  )

  const handleBackToUserList = () => {
    navigate('/chat')
  }

  // Function to restore conversation state
  const restoreConversationState = useCallback(() => {
    if (selectedUser?.conversationId && !selectedConversation) {
      setSelectedConversation(selectedUser.conversationId)
      currentConversationRef.current = selectedUser.conversationId
    }
  }, [selectedUser, selectedConversation])

  // Handle conversation parameter from URL (for notifications)
  useEffect(() => {
    if (conversationParam && conversations.length > 0) {
      const conversation = conversations.find(
        (conv) => conv._id === conversationParam
      )
      if (conversation) {
        setSelectedConversation(conversationParam)

        // Mark messages as read when navigating from notification
        try {
          chatService.markMessagesAsRead(conversationParam)

          // Update conversations list to reset unread count
          setConversations((prev) =>
            prev.map((conv) =>
              conv._id === conversationParam
                ? {
                    ...conv,
                    unreadCount: { ...conv.unreadCount, [authUser.id]: 0 }
                  }
                : conv
            )
          )
        } catch (readError) {
          console.error(
            'Error marking messages as read from notification:',
            readError
          )
        }

        // Find the corresponding user for this conversation
        if (conversation.type === 'individual') {
          const otherUser = conversation.participants.find(
            (p) => p._id !== authUser.id
          )
          if (otherUser) {
            const user = combinedUsers().find((u) => u.id === otherUser._id)
            if (user) {
              setSelectedUser(user)

              // Update the user's unread count to 0
              setUsers((prev) =>
                prev.map((u) =>
                  u.id === user.id ? { ...u, unreadCount: 0 } : u
                )
              )
            }
          }
        } else {
          // For group conversations, create a user object
          const groupUser = {
            id: conversation._id,
            name: conversation.conversationName || conversation.groupName,
            avatar: conversation.groupImage || '',
            status: 'online',
            lastMessage: conversation.lastMessage?.content || '',
            lastMessageTime: conversation.lastMessageAt
              ? moment(conversation.lastMessageAt).format(
                  'DD MMM YYYY, hh:mm A'
                )
              : '',
            unreadCount: 0, // Reset unread count
            conversationId: conversation._id,
            conversationType: conversation.type
          }
          setSelectedUser(groupUser)
        }
      }
    }
  }, [conversationParam, conversations, authUser.id, combinedUsers])

  // Mobile view - show only user list or chat window
  if (isMobile) {
    if (selectedUser) {
      // Show chat window with back button
      return (
        <Box
          sx={{
            height: 'calc(100vh - 64px)',
            display: 'flex',
            flexDirection: 'column',
            position: 'absolute',
            top: '64px',
            left: 0,
            right: 0,
            bottom: 0
          }}
        >
          <AppBar position="static" elevation={1}>
            <Toolbar>
              <IconButton
                edge="start"
                color="inherit"
                onClick={handleBackToUserList}
                sx={{ mr: 2 }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                {selectedUser && (
                  <>
                    <Box sx={{ mr: 2 }}>
                      <img
                        src={selectedUser.avatar}
                        alt={selectedUser.name}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                        {selectedUser.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color:
                            selectedUser.status === 'online'
                              ? 'success.main'
                              : 'text.secondary',
                          fontSize: '0.875rem'
                        }}
                      >
                        {selectedUser.status === 'online'
                          ? 'Online'
                          : formatLastSeen(selectedUser.lastSeen)}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            </Toolbar>
          </AppBar>
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Outlet
              context={{
                selectedUser,
                messages,
                setMessages,
                selectedConversation,
                restoreConversationState
              }}
            />
          </Box>
        </Box>
      )
    } else {
      // Show user list
      return (
        <Box
          sx={{
            height: 'calc(100vh - 64px)',
            display: 'flex',
            flexDirection: 'column',
            position: 'absolute',
            top: '64px',
            left: 0,
            right: 0,
            bottom: 0
          }}
        >
          <AppBar position="static" elevation={1}>
            <Toolbar>
              <Typography variant="h6">Messages</Typography>
              <Box sx={{ flex: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: isConnected ? 'success.main' : 'error.main'
                  }}
                />
                <Typography variant="caption" color="white">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Typography> */}
                {/* Debug: Show online users count */}
                {/* <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                  Online: {onlineUsers.length}
                </Typography> */}
                {/* Debug: Manual refresh button */}
                {/* <IconButton
                  size="small"
                  onClick={() => socket?.emit('get_online_users')}
                  sx={{ ml: 1 }}
                >
                  <Typography variant="caption">🔄</Typography>
                </IconButton> */}
              </Box>
            </Toolbar>
          </AppBar>
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <UserList
              users={combinedUsers()}
              selectedUser={selectedUser}
              onUserSelect={handleUserSelect}
            />
          </Box>
        </Box>
      )
    }
  }

  // Desktop view - show two-column layout
  return (
    <Box
      sx={{
        display: 'flex',
        height: 'calc(100vh - 64px)', // Account for topbar height
        overflow: 'hidden', // Prevent outer scroll
        // Responsive design
        flexDirection: { xs: 'column', md: 'row' }
      }}
    >
      {/* Left column - User List */}
      <Box
        sx={{
          width: { xs: '100%', md: '30%' },
          height: { xs: '50%', md: '100%' },
          borderRight: { xs: 0, md: '1px solid #e0e0e0' },
          borderBottom: { xs: 1, md: 0 },

          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            px: '16px',
            py: '18px',
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          <Typography variant="h6">Messages</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: isConnected ? 'success.main' : 'error.main'
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {isConnected ? 'Connected' : 'Disconnected'}
            </Typography> */}
            {/* Debug: Show online users count */}
            {/* <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
              Online: {onlineUsers.length}
            </Typography> */}
            {/* Debug: Manual refresh button */}
            {/* <IconButton
              size="small"
              onClick={() => socket?.emit('get_online_users')}
              sx={{ ml: 1 }}
            >
              <Typography variant="caption">🔄</Typography>
            </IconButton> */}
          </Box>
        </Box>
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <UserList
            users={combinedUsers()}
            selectedUser={selectedUser}
            onUserSelect={handleUserSelect}
          />
        </Box>
      </Box>

      {/* Right column - Chat Window */}
      <Box
        sx={{
          width: { xs: '100%', md: '70%' },
          height: { xs: '50%', md: '100%' },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {selectedUser ? (
          <Outlet
            context={{
              selectedUser,
              messages,
              setMessages,
              selectedConversation,
              restoreConversationState
            }}
          />
        ) : (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.default'
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Select a user to start chatting
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default ChatLayout
