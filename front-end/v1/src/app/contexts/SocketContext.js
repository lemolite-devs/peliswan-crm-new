// src/SocketContext.js
import useAuth from 'app/hooks/useAuth'
import axios from 'axios'
import axiosInstance from 'axiosInstance'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { useReducer } from 'react'
import { io } from 'socket.io-client'

// Create a context for the socket
const SocketContext = createContext()

const reducer = (state, action) => {
  switch (action.type) {
    case 'LOAD_NOTIFICATIONS': {
      return { ...state, notifications: action.payload }
    }

    case 'DELETE_NOTIFICATION': {
      return { ...state, notifications: action.payload }
    }

    case 'CLEAR_NOTIFICATIONS': {
      return { ...state, notifications: action.payload }
    }

    default:
      return state
  }
}

// Create a provider component
export const SocketProvider = ({ children }) => {
  const [leadsOverview, setLeadsOverview] = useState([])
  const [transferLeadNotification, setTransferLeadNotification] = useState(null)
  const [state, dispatch] = useReducer(reducer, [])
  const { user } = useAuth()
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const maxReconnectAttempts = 5

  const deleteNotification = async (notificationID) => {
    try {
      const res = await axios.post('/api/notification/delete', {
        id: notificationID
      })
      dispatch({ type: 'DELETE_NOTIFICATION', payload: res.data })
    } catch (e) {
      console.error(e)
    }
  }

  const clearNotifications = async () => {
    try {
      const res = await axios.post('/api/notification/delete-all')
      dispatch({ type: 'CLEAR_NOTIFICATIONS', payload: res.data })
    } catch (e) {
      console.error(e)
    }
  }

  const getNotifications = async () => {
    try {
      const res = await axiosInstance.get(
        '/api/announcements/weekly-notification'
      )

      dispatch({ type: 'LOAD_NOTIFICATIONS', payload: res.data.notifications })
    } catch (e) {
      console.error(e)
    }
  }

  const createNotification = async (notifications) => {
    try {
      // const res = await axios.post('/api/notification/add', { notification })

      // dispatch({ type: 'CREATE_NOTIFICATION', payload: res.data })
      dispatch({
        type: 'LOAD_NOTIFICATIONS',
        payload: [...state.notifications, { ...notifications, isRead: false }]
      })
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    getNotifications()
  }, [])

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = io(
      process.env.REACT_APP_API_BASE_URL || 'http://localhost:9001',
      {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
      }
    )

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  // Handle socket connection events
  useEffect(() => {
    if (!socket) return

    const handleConnect = () => {
      setIsConnected(true)
      setConnectionAttempts(0)
      if (user?.id) {
        socket.emit('user_connected', { userId: user?.id, role: user?.role })
      }
    }

    const handleDisconnect = () => {
      setIsConnected(false)
      setConnectionAttempts((prev) => prev + 1)
    }

    const handleReconnect = (attemptNumber) => {
      console.log(`Reconnection attempt ${attemptNumber}`)
    }

    const handleReconnectFailed = () => {
      console.log('Reconnection failed')
    }

    // Listen for socket connection events
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('reconnect', handleReconnect)
    socket.on('reconnect_failed', handleReconnectFailed)

    // If socket is already connected and user is available, emit user_connected
    if (socket.connected && user?.id) {
      socket.emit('user_connected', { userId: user?.id, role: user?.role })
    }

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('reconnect', handleReconnect)
      socket.off('reconnect_failed', handleReconnectFailed)
    }
  }, [socket, user])

  // Listen for socket events related to different charts
  useEffect(() => {
    if (!socket || !user?.id) return

    socket.emit('user_connected', { userId: user?.id, role: user?.role })

    // Listen for leads overview data updates
    socket.on('leads_overview', (data) => {
      setLeadsOverview(data)
    })

    socket.on('transfer_lead', (data) => {
      createNotification(data)
      setTransferLeadNotification(data)
    })

    // Cleanup listeners on component unmount
    return () => {
      socket.off('leads_overview')
      socket.off('transfer_lead')
    }
  }, [socket, user])

  // Heartbeat mechanism
  useEffect(() => {
    if (!socket) return

    const heartbeatInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping')
      }
    }, 30000) // Send ping every 30 seconds

    // Listen for pong response
    const handlePong = () => {
      // Connection is alive
    }

    socket.on('pong', handlePong)

    return () => {
      clearInterval(heartbeatInterval)
      socket.off('pong', handlePong)
    }
  }, [socket])

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        connectionAttempts,
        leadsOverview,
        transferLeadNotification,
        setTransferLeadNotification,
        getNotifications,
        // deleteNotification,
        clearNotifications,
        createNotification,
        notifications: state.notifications
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

// Custom hook to use the socket in other components
export const useSocket = () => useContext(SocketContext)
