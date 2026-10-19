// src/components/ChatBox.js
import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Drawer,
  TextField,
  IconButton,
  Typography
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import ChatIcon from '@mui/icons-material/Chat'
import { useSocket } from 'app/contexts/SocketContext'

// Sample messages for demonstration
const initialMessages = []

const ChatBox = () => {
  const [isOpen, setIsOpen] = useState(false) // State to manage drawer open/close
  const [messages, setMessages] = useState(initialMessages) // State to manage messages
  const [inputMessage, setInputMessage] = useState('') // State for input field
  const { socket } = useSocket() // Use the socket instance

  // Toggle chat drawer
  const toggleDrawer = (open) => (event) => {
    if (
      event.type === 'keydown' &&
      (event.key === 'Tab' || event.key === 'Shift')
    ) {
      return
    }
    setIsOpen(open)
  }

  // Handle message send
  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      socket.emit('message', inputMessage)
      setInputMessage('')
    }
  }

  useEffect(() => {
    // Listen for messages from the server
    socket.on('message', (message) => {
      console.log('Message coming from server :>', message)
      setMessages((prevMessages) => [...prevMessages, message])
    })

    // Cleanup listener on component unmount
    return () => {
      socket.off('message')
    }
  }, [socket])
  return (
    <div>
      {/* Button to open chatbox */}
      <Button
        variant="contained"
        color="primary"
        onClick={toggleDrawer(true)}
        style={{
          position: 'fixed',
          bottom: 10,
          right: 20,
          borderRadius: '50%'
        }}
      >
        <ChatIcon />
      </Button>

      {/* Chat drawer */}
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={toggleDrawer(false)}
        PaperProps={{
          sx: {
            width: 300, // Width of the chat drawer
            maxHeight: '50%', // Maximum height of the drawer
            position: 'fixed',
            top: 100,
            right: 40, // Position it 20px from the right side
            bottom: 40, // Position it 20px from the bottom
            borderRadius: '8px 8px 0 0', // Rounded corners on the top side
            overflow: 'hidden'
          }
        }}
      >
        {/* Chat header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            p: 2,
            borderBottom: '1px solid #ddd'
          }}
        >
          <Typography variant="h6">Quick Chat</Typography>
        </Box>

        {/* Chat messages */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}
        >
          {messages.map((msg) => (
            <Box
              key={msg.id}
              sx={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: msg.sender === 'user' ? '#1976d2' : '#f1f1f1',
                color: msg.sender === 'user' ? '#fff' : '#000',
                borderRadius: 2,
                p: 1,
                maxWidth: '70%'
              }}
            >
              {msg}
            </Box>
          ))}
        </Box>

        {/* Chat input */}
        <Box
          sx={{
            display: 'flex',
            p: 1,
            borderTop: '1px solid #ddd'
          }}
        >
          <TextField
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            fullWidth
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <IconButton color="primary" onClick={handleSendMessage}>
            <SendIcon />
          </IconButton>
        </Box>
      </Drawer>
    </div>
  )
}

export default ChatBox
