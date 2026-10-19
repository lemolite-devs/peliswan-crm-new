import { createContext, useEffect, useReducer } from 'react'
import axios from 'axios'
import axiosInstance from 'axiosInstance'

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

const NotificationContext = createContext({
  notifications: [],
  deleteNotification: () => {},
  clearNotifications: () => {},
  getNotifications: () => {},
  createNotification: () => {}
})

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, [])

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

  return (
    <NotificationContext.Provider
      value={{
        getNotifications,
        deleteNotification,
        clearNotifications,
        createNotification,
        notifications: state.notifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export default NotificationContext
