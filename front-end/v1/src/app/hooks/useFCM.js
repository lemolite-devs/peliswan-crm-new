import { useState, useEffect, useCallback } from 'react'
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported
} from 'firebase/messaging'
import { initializeApp } from 'firebase/app'
import axiosInstance from 'axiosInstance'

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Messaging needs a secure context (HTTPS or localhost) and service worker
// support. On plain HTTP over a LAN IP, `navigator.serviceWorker` is undefined
// and getMessaging() throws, so resolve it lazily and only when supported.
let messagingPromise = null

const getMessagingIfSupported = () => {
  if (!messagingPromise) {
    messagingPromise = isSupported()
      .then((supported) => {
        if (!supported) {
          console.warn(
            'FCM is not supported in this browser/context (requires HTTPS or localhost). Push notifications are disabled.'
          )
          return null
        }
        return getMessaging(app)
      })
      .catch((error) => {
        console.warn('FCM is unavailable:', error)
        return null
      })
  }
  return messagingPromise
}

const useFCM = () => {
  const [token, setToken] = useState(null)
  const [notification, setNotification] = useState(null)
  const [permission, setPermission] = useState('default')

  // Request notification permission
  const requestPermission = useCallback(async () => {
    try {
      if (typeof Notification === 'undefined') {
        console.warn('Notifications are not available in this browser/context')
        return false
      }

      const permission = await Notification.requestPermission()
      setPermission(permission)

      if (permission === 'granted') {
        console.log('Notification permission granted')
        return true
      } else {
        console.log('Notification permission denied')
        return false
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }, [])

  // Get FCM token
  const getFCMToken = useCallback(async () => {
    try {
      const messaging = await getMessagingIfSupported()
      if (!messaging) return null

      if (permission !== 'granted') {
        const granted = await requestPermission()
        if (!granted) return null
      }

      const currentToken = await getToken(messaging, {
        vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY
      })

      if (currentToken) {
        setToken(currentToken)
        console.log('FCM Token:', currentToken)
        return currentToken
      } else {
        console.log('No registration token available')
        return null
      }
    } catch (error) {
      console.error('Error getting FCM token:', error)
      return null
    }
  }, [permission, requestPermission])

  // Update FCM token on server
  const updateFCMToken = useCallback(async (fcmToken) => {
    try {
      await axiosInstance.put('/api/notifications/fcm-token', {
        fcmToken
      })
    } catch (error) {
      console.error('Error updating FCM token on server:', error)
    }
  }, [])

  // Handle foreground messages
  const handleForegroundMessage = useCallback((payload) => {
    console.log('Received foreground message:', payload)

    // Show browser notification
    if (
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted'
    ) {
      const notificationTitle = payload.notification.title
      const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon || '/logo192.png',
        badge: payload.notification.badge || '/logo192.png',
        data: payload.data,
        requireInteraction: true,
        silent: false
      }

      const browserNotification = new Notification(
        notificationTitle,
        notificationOptions
      )

      // Handle notification click
      browserNotification.onclick = () => {
        browserNotification.close()

        // Navigate to specific page based on notification data
        if (payload.data && payload.data.url) {
          // Use the URL from notification data if available
          window.location.href = payload.data.url
        } else if (payload.data && payload.data.path) {
          window.location.href = `/${payload.data.path}`
        }
      }

      // Auto close after 5 seconds
      setTimeout(() => {
        browserNotification.close()
      }, 5000)
    }

    // Set notification state for UI updates
    setNotification(payload)
  }, [])

  // Initialize FCM
  useEffect(() => {
    let unsubscribe = null
    let cancelled = false

    const initializeFCM = async () => {
      try {
        const messaging = await getMessagingIfSupported()
        if (!messaging || cancelled) return

        // Register service worker
        if ('serviceWorker' in navigator) {
          await navigator.serviceWorker.register('/firebase-messaging-sw.js')
        }

        // Get FCM token
        const fcmToken = await getFCMToken()
        if (fcmToken) {
          await updateFCMToken(fcmToken)
        }

        if (cancelled) return

        // Listen for foreground messages
        unsubscribe = onMessage(messaging, handleForegroundMessage)
      } catch (error) {
        console.error('Error initializing FCM:', error)
      }
    }

    initializeFCM()

    return () => {
      cancelled = true
      if (unsubscribe) unsubscribe()
    }
  }, [getFCMToken, updateFCMToken, handleForegroundMessage])

  // Refresh token when it changes
  useEffect(() => {
    if (token) {
      updateFCMToken(token)
    }
  }, [token, updateFCMToken])

  return {
    token,
    notification,
    permission,
    requestPermission,
    getFCMToken,
    updateFCMToken
  }
}

export default useFCM
