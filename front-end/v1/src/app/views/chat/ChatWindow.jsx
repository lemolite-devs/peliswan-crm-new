import React, { useState, useRef, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  Avatar,
  Divider,
  useTheme,
  Popover
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions'
import { useSocket } from 'app/contexts/SocketContext'
import useAuth from 'app/hooks/useAuth'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { chatService } from 'app/services/chatService'
import moment from 'moment'

const ChatWindow = () => {
  const {
    selectedUser,
    messages,
    setMessages,
    selectedConversation,
    restoreConversationState
  } = useOutletContext()
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const [emojiPickerAnchor, setEmojiPickerAnchor] = useState(null)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const theme = useTheme()
  const { socket } = useSocket()
  const { user: authUser } = useAuth()

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

  // Helper function to generate initials from name
  const getInitials = (name) => {
    if (!name) return ''

    const nameParts = name.trim().split(' ')
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase()
    } else {
      return (
        nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)
      ).toUpperCase()
    }
  }

  // Helper function to generate background color based on name
  const getAvatarColor = (name) => {
    if (!name) return '#1976d2'

    const colors = [
      '#1976d2', // blue
      '#388e3c', // green
      '#d32f2f', // red
      '#7b1fa2', // purple
      '#f57c00', // orange
      '#00796b', // teal
      '#c2185b', // pink
      '#5d4037', // brown
      '#455a64', // blue grey
      '#ff6f00' // amber
    ]

    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }

    return colors[Math.abs(hash) % colors.length]
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, typingUsers])

  // Handle typing indicators
  useEffect(() => {
    if (!socket) return

    const handleUserTyping = ({
      conversationId,
      userId,
      isTyping: userIsTyping
    }) => {
      if (conversationId === selectedConversation && userId !== authUser.id) {
        if (userIsTyping) {
          setTypingUsers((prev) => {
            if (!prev.includes(userId)) {
              return [...prev, userId]
            }
            return prev
          })
        } else {
          setTypingUsers((prev) => prev.filter((id) => id !== userId))
        }
      }
    }

    socket.on('user_typing', handleUserTyping)

    return () => {
      socket.off('user_typing', handleUserTyping)
    }
  }, [socket, selectedConversation, authUser.id])

  // Handle typing input
  const handleTyping = (e) => {
    setNewMessage(e.target.value)

    if (!isTyping) {
      setIsTyping(true)
      socket?.emit('typing_start', {
        conversationId: selectedConversation,
        userId: authUser.id
      })
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      socket?.emit('typing_stop', {
        conversationId: selectedConversation,
        userId: authUser.id
      })
    }, 1000)
  }

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  // Clean up optimistic messages when conversation changes
  useEffect(() => {
    // Remove any stale optimistic messages when conversation changes
    setMessages((prev) => {
      const messagesToRemove = prev.filter((msg) => msg.isOptimistic)
      // Clear retry timeouts for removed messages
      messagesToRemove.forEach((msg) => {
        if (msg.retryTimeout) {
          clearTimeout(msg.retryTimeout)
        }
      })
      return prev.filter((msg) => !msg.isOptimistic)
    })
  }, [selectedConversation])

  // Auto-cleanup optimistic messages after timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      setMessages((prev) => {
        const messagesToRemove = prev.filter((msg) => msg.isOptimistic)
        // Clear retry timeouts for removed messages
        messagesToRemove.forEach((msg) => {
          if (msg.retryTimeout) {
            clearTimeout(msg.retryTimeout)
          }
        })
        return prev.filter((msg) => !msg.isOptimistic)
      })
    }, 10000) // Remove optimistic messages after 10 seconds

    return () => clearTimeout(timeout)
  }, [messages.filter((msg) => msg.isOptimistic).length]) // Re-run when optimistic message count changes

  // Cleanup retry timeouts on unmount
  useEffect(() => {
    return () => {
      // Clear all retry timeouts when component unmounts
      setMessages((prev) => {
        prev.forEach((msg) => {
          if (msg.retryTimeout) {
            clearTimeout(msg.retryTimeout)
          }
        })
        return prev
      })
    }
  }, [])

  // Listen for socket events
  useEffect(() => {
    if (!socket) return

    // Listen for message sent confirmation
    const handleMessageSent = (data) => {
      console.log('Message sent successfully:', data.messageId)
      // Replace optimistic message with real message
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.isOptimistic) {
            // Clear retry timeout if it exists
            if (msg.retryTimeout) {
              clearTimeout(msg.retryTimeout)
            }
            return {
              ...msg,
              id: data.messageId,
              isOptimistic: false
            }
          }
          return msg
        })
      )
    }

    // Listen for message errors
    const handleMessageError = (data) => {
      console.error('Message sending failed:', data.message)

      // Try to send via REST API as fallback
      const sendViaAPI = async () => {
        try {
          const response = await chatService.sendMessage(selectedConversation, {
            content: data.content || newMessage,
            messageType: 'text'
          })

          // Replace optimistic message with real message from API
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.isOptimistic) {
                // Clear retry timeout if it exists
                if (msg.retryTimeout) {
                  clearTimeout(msg.retryTimeout)
                }
                return {
                  ...msg,
                  id: response.data._id,
                  isOptimistic: false
                }
              }
              return msg
            })
          )
        } catch (apiError) {
          console.error('REST API fallback also failed:', apiError)
          // Remove optimistic message if both socket and API fail
          setMessages((prev) => prev.filter((msg) => !msg.isOptimistic))
        }
      }

      sendViaAPI()
    }

    // Listen for new messages
    const handleNewMessage = (data) => {
      // Only add message if it's for the current conversation
      if (data.conversationId === selectedConversation) {
        // Check if this message is from the current user (optimistic message replacement)
        const isFromCurrentUser = data.message.sender._id === authUser.id

        if (isFromCurrentUser) {
          // Replace optimistic message with real message
          setMessages((prev) =>
            prev.map((msg) =>
              msg.isOptimistic
                ? {
                    id: data.message._id,
                    userId: data.message.sender._id,
                    text: data.message.content,
                    sender: 'me',
                    timestamp: moment(data.message.createdAt).format(
                      'DD MMM YYYY, hh:mm A'
                    ),

                    user: {
                      name: data.message.sender.name || '',
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
            const messageExists = prev.some(
              (msg) => msg.id === data.message._id
            )
            if (messageExists) {
              return prev // Don't add duplicate
            }

            // Add new message from other user
            const newMessage = {
              id: data.message._id,
              userId: data.message.sender._id,
              text: data.message.content,
              sender: 'other',
              timestamp: moment(data.message.createdAt).format(
                'DD MMM YYYY, hh:mm A'
              ),
              user: {
                name: data.message.sender.name || '',
                avatar: ''
              }
            }

            return [...prev, newMessage]
          })
        }
      }
    }

    socket.on('message_sent', handleMessageSent)
    socket.on('message_error', handleMessageError)
    socket.on('new_message', handleNewMessage)

    return () => {
      socket.off('message_sent', handleMessageSent)
      socket.off('message_error', handleMessageError)
      socket.off('new_message', handleNewMessage)
    }
  }, [socket, selectedConversation, authUser.id])

  // Send message via socket
  const handleSendMessage = () => {
    if (!newMessage.trim()) {
      return
    }

    if (!socket) {
      alert('Connection lost. Please refresh the page.')
      return
    }

    if (!selectedConversation) {
      // Try to use the conversation ID from selectedUser if available
      if (selectedUser?.conversationId) {
        console.log(
          'Using conversation ID from selectedUser:',
          selectedUser.conversationId
        )
        // Update the selectedConversation state
        // Note: This is a workaround - ideally the state should be properly managed
        const conversationId = selectedUser.conversationId

        // Try to send the message with the conversation ID from selectedUser
        const messageToSend = newMessage
        setNewMessage('')

        setTimeout(() => {
          console.log(
            `Emitting send_message event for conversation: ${conversationId}`
          )
          socket.emit('send_message', {
            conversationId: conversationId,
            content: messageToSend,
            messageType: 'text'
          })
        }, 100)
        return
      }

      // Additional fallback: try to find conversation in the URL
      const urlParams = new URLSearchParams(window.location.search)
      const conversationParam = urlParams.get('conversation')
      if (conversationParam) {
        const messageToSend = newMessage
        setNewMessage('')

        setTimeout(() => {
          socket.emit('send_message', {
            conversationId: conversationParam,
            content: messageToSend,
            messageType: 'text'
          })
        }, 100)
        return
      }

      // Final fallback: try to restore from localStorage
      const savedConversation = localStorage.getItem('selectedConversation')
      const savedUserId = localStorage.getItem('selectedUserId')
      const currentUserId = window.location.pathname.split('/').pop()

      if (savedConversation && savedUserId === currentUserId) {
        const messageToSend = newMessage
        setNewMessage('')

        setTimeout(() => {
          socket.emit('send_message', {
            conversationId: savedConversation,
            content: messageToSend,
            messageType: 'text'
          })
        }, 100)
        return
      }

      alert('No conversation selected. Please select a user to chat with.')
      return
    }

    // Stop typing indicator
    setIsTyping(false)
    socket.emit('typing_stop', {
      conversationId: selectedConversation,
      userId: authUser.id
    })

    // Create temporary message ID for optimistic update
    const tempMessageId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${authUser.id}`

    // Optimistically update UI with temporary message
    const optimisticMessage = {
      id: tempMessageId,
      userId: authUser.id,
      text: newMessage,
      sender: 'me',
      timestamp: moment().format('DD MMM YYYY, hh:mm A'),
      user: {
        name: authUser.name,
        avatar: ''
      },
      isOptimistic: true, // Flag to identify optimistic messages
      tempId: tempMessageId // Additional identifier for replacement
    }

    setMessages((prev) => [...prev, optimisticMessage])
    const messageToSend = newMessage
    setNewMessage('')

    // Add a small delay to prevent rapid message sending
    setTimeout(() => {
      // Try to send message via socket first
      socket.emit('send_message', {
        conversationId: selectedConversation,
        content: messageToSend,
        messageType: 'text'
      })

      // Set a timeout to retry if no confirmation received
      const retryTimeout = setTimeout(() => {
        console.log('No message confirmation received, retrying...')
        socket.emit('send_message', {
          conversationId: selectedConversation,
          content: messageToSend,
          messageType: 'text'
        })
      }, 3000) // Retry after 3 seconds

      // Store the timeout ID to clear it if message is sent successfully
      optimisticMessage.retryTimeout = retryTimeout
    }, 100)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setNewMessage((prev) => prev + emoji.native)
    setEmojiPickerAnchor(null)
  }

  // Open emoji picker
  const handleEmojiClick = (event) => {
    setEmojiPickerAnchor(event.currentTarget)
  }

  // Close emoji picker
  const handleEmojiPickerClose = () => {
    setEmojiPickerAnchor(null)
  }

  // Only show messages for this conversation
  const filteredMessages = messages

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

  // Monitor and restore conversation state if lost
  useEffect(() => {
    if (!selectedConversation && selectedUser?.conversationId) {
      console.log(
        'Conversation state lost, attempting to restore from selectedUser'
      )
      restoreConversationState()
    } else if (!selectedConversation && !selectedUser?.conversationId) {
      // Try to restore from localStorage as a last resort
      const savedConversation = localStorage.getItem('selectedConversation')
      const savedUserId = localStorage.getItem('selectedUserId')
      const currentUserId = window.location.pathname.split('/').pop()

      if (savedConversation && savedUserId === currentUserId) {
        console.log(
          'Attempting to restore conversation from localStorage:',
          savedConversation
        )
        restoreConversationState()
      }
    }
  }, [selectedConversation, selectedUser, restoreConversationState])

  return (
    <Box
      sx={{
        height: { xs: '100%', md: 'calc(100vh - 64px)' }, // Responsive height
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden' // Prevent outer scroll
      }}
    >
      {/* Chat Header - Fixed */}
      <Box
        sx={{
          flexShrink: 0, // Prevent header from shrinking
          px: '16px',
          py: '12px',
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}
      >
        <Avatar
          src={selectedUser?.avatar}
          alt={selectedUser?.name}
          sx={{
            backgroundColor: getAvatarColor(selectedUser?.name),
            color: 'white',
            fontWeight: 600
          }}
        >
          {getInitials(selectedUser?.name)}
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            {selectedUser?.name}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color:
                selectedUser?.status === 'online'
                  ? 'success.main'
                  : 'text.secondary',
              fontSize: '0.875rem'
            }}
          >
            {selectedUser?.status === 'online'
              ? 'Online'
              : formatLastSeen(selectedUser?.lastSeen)}
          </Typography>
        </Box>
      </Box>

      {/* Messages Area - Scrollable */}
      <Box
        sx={{
          flex: 1, // Take remaining space
          overflow: 'auto', // Enable scroll
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          minHeight: 0 // Important for flex child scrolling
        }}
      >
        {filteredMessages.map((message, index) => (
          <Box
            key={`${message.id}_${message.isOptimistic ? 'temp' : 'real'}_${index}`}
            sx={{
              display: 'flex',
              justifyContent:
                message.sender === 'me' ? 'flex-end' : 'flex-start',
              mb: 1
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: message.sender === 'me' ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
                gap: 1,
                maxWidth: '70%'
              }}
            >
              {message.sender !== 'me' && (
                <Avatar
                  src={message.user?.avatar || selectedUser?.avatar}
                  alt={message.user?.name || selectedUser?.name}
                  sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: getAvatarColor(
                      message.user?.name || selectedUser?.name
                    ),
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.75rem'
                  }}
                >
                  {getInitials(message.user?.name || selectedUser?.name)}
                </Avatar>
              )}
              <Paper
                sx={{
                  p: 1.5,
                  backgroundColor:
                    message.sender === 'me' ? 'primary.main' : 'grey.100',
                  color: message.sender === 'me' ? 'white' : 'text.primary',
                  borderRadius: 2,
                  maxWidth: '100%',
                  wordBreak: 'break-word',
                  opacity: message.isOptimistic ? 0.7 : 1,
                  position: 'relative'
                }}
              >
                <Typography variant="body2">{message.text}</Typography>
                {message.isOptimistic && (
                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: 8,
                      backgroundColor: 'warning.main',
                      color: 'white',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.7rem'
                    }}
                  >
                    Sending...
                  </Typography>
                )}
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 0.5,
                    opacity: 0.7,
                    fontSize: '0.75rem'
                  }}
                >
                  {message.timestamp}
                </Typography>
              </Paper>
            </Box>
          </Box>
        ))}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-start',
              mb: 1
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 1,
                maxWidth: '70%'
              }}
            >
              <Avatar
                src={selectedUser?.avatar}
                alt={selectedUser?.name}
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: getAvatarColor(selectedUser?.name),
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              >
                {getInitials(selectedUser?.name)}
              </Avatar>
              <Paper
                sx={{
                  p: 1.5,
                  backgroundColor: 'grey.100',
                  borderRadius: 2,
                  maxWidth: '100%'
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontStyle: 'italic', color: 'text.secondary' }}
                >
                  {typingUsers.length === 1
                    ? 'typing...'
                    : `${typingUsers.length} people typing...`}
                </Typography>
              </Paper>
            </Box>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area - Fixed at bottom */}
      <Box
        sx={{
          flexShrink: 0, // Prevent input area from shrinking
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          width: '100%'
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          {/* <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <AttachFileIcon />
          </IconButton> */}
          <IconButton
            size="small"
            sx={{ color: 'text.secondary' }}
            onClick={handleEmojiClick}
          >
            <EmojiEmotionsIcon />
          </IconButton>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={newMessage}
            onChange={handleTyping}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3
              }
            }}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark'
              },
              '&.Mui-disabled': {
                backgroundColor: 'grey.300',
                color: 'grey.500'
              }
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Emoji Picker Popover */}
      <Popover
        open={Boolean(emojiPickerAnchor)}
        anchorEl={emojiPickerAnchor}
        onClose={handleEmojiPickerClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
      >
        <Picker
          data={data}
          onEmojiSelect={handleEmojiSelect}
          theme={theme.palette.mode}
          set="native"
          previewPosition="none"
          skinTonePosition="none"
        />
      </Popover>
    </Box>
  )
}

export default ChatWindow
