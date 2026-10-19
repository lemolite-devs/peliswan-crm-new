import React, { Fragment, useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Box,
  Card,
  Badge,
  Drawer,
  styled,
  IconButton,
  ThemeProvider,
  Checkbox,
  FormControlLabel,
  Avatar,
  Typography
} from '@mui/material'
import {
  Notifications,
  Clear,
  Person,
  Business,
  Assignment,
  Info,
  Warning,
  Campaign,
  Update
} from '@mui/icons-material'
import useSettings from 'app/hooks/useSettings'
import { sideNavWidth, topBarHeight } from 'app/utils/constant'
import { themeShadows } from '../MatxTheme/themeColors'
import { Small } from '../Typography'
import moment from 'moment'
import { useSocket } from 'app/contexts/SocketContext'
import shortid from 'shortid'
import useFCM from 'app/hooks/useFCM'
import NotificationSettings from '../NotificationSettings/NotificationSettings'
import axiosInstance from 'axiosInstance'

const Notification = styled('div')(() => ({
  padding: '16px',
  marginBottom: '16px',
  display: 'flex',
  alignItems: 'center',
  height: topBarHeight,
  boxShadow: themeShadows[6],
  '& h5': {
    marginLeft: '8px',
    marginTop: 0,
    marginBottom: 0,
    fontWeight: '500'
  }
}))

const NotificationCard = styled(Box)(({ theme }) => ({
  position: 'relative',
  marginBottom: '8px',
  borderRadius: '8px',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    '& .messageTime': {
      opacity: 0.7
    },
    '& .deleteButton': {
      opacity: '1'
    }
  },
  '& .messageTime': {
    color: theme.palette.text.secondary,
    transition: 'opacity 0.3s ease'
  }
}))

const DeleteButton = styled(IconButton)(({ theme }) => ({
  opacity: '0',
  position: 'absolute',
  right: 6,
  top: 6,
  zIndex: 2,
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  width: '28px',
  height: '28px',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'rgba(255, 255, 255, 1)',
    transform: 'scale(1.05)'
  }
}))

const NotificationContent = styled(Card)(({ theme }) => ({
  border: 'none',
  borderRadius: '8px',
  overflow: 'hidden',
  background: theme.palette.background.paper,
  position: 'relative'
}))

const StatusIndicator = styled('div')(({ status, theme }) => ({
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  width: '4px',
  background:
    status === 'unread'
      ? theme.palette.error.main
      : status === 'read'
        ? theme.palette.success.main
        : theme.palette.grey[300]
}))

const CardHeader = styled('div')(({ theme }) => ({
  padding: '12px',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  position: 'relative'
}))

const NotificationAvatar = styled(Avatar)(({ notifType, theme }) => {
  const getBackgroundColor = () => {
    switch (notifType) {
      case 'lead':
        return theme.palette.primary.main
      case 'task':
        return theme.palette.warning.main
      case 'alert':
        return theme.palette.error.main
      case 'info':
        return theme.palette.info.main
      case 'business':
        return theme.palette.secondary.main
      case 'campaign':
        return theme.palette.success.main
      case 'update':
        return theme.palette.info.main
      default:
        return theme.palette.grey[500]
    }
  }

  return {
    width: '32px',
    height: '32px',
    background: getBackgroundColor(),
    color: 'white',
    fontWeight: '600',
    fontSize: '0.8rem'
  }
})

const CardContent = styled('div')(() => ({
  padding: '0 12px 12px 12px'
}))

const TimeAndAction = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: '8px',
  paddingTop: '8px',
  borderTop: '1px solid rgba(0,0,0,0.08)'
}))

// Enhanced helper function to get notification type, icon and avatar content
const getNotificationMeta = (notification) => {
  const title = notification.title?.toLowerCase() || ''
  const subtitle = notification.subtitle?.toLowerCase() || ''

  // Method 1: Use first letter of sender's name or title as avatar
  const getAvatarContent = () => {
    // Try to extract name from subtitle (e.g., "You have received a new lead from John Doe")
    const nameMatch = subtitle.match(/from\s+([a-zA-Z]+)/i)
    if (nameMatch && nameMatch[1]) {
      return nameMatch[1].charAt(0).toUpperCase()
    }

    // Try to get first letter from title
    if (notification.title) {
      return notification.title.charAt(0).toUpperCase()
    }

    return '?'
  }

  // Determine notification type and appropriate icon/avatar
  if (title.includes('lead') || subtitle.includes('lead')) {
    return {
      type: 'lead',
      icon: <Person />,
      avatarContent: getAvatarContent(),
      showIcon: false // Use avatar content instead of icon
    }
  } else if (title.includes('task') || subtitle.includes('task')) {
    return {
      type: 'task',
      icon: <Assignment />,
      avatarContent: 'T',
      showIcon: true // Show task icon
    }
  } else if (title.includes('alert') || subtitle.includes('alert')) {
    return {
      type: 'alert',
      icon: <Warning />,
      avatarContent: '!',
      showIcon: true // Show warning icon
    }
  } else if (title.includes('update') || subtitle.includes('update')) {
    return {
      type: 'update',
      icon: <Update />,
      avatarContent: 'U',
      showIcon: true // Show update icon
    }
  } else if (title.includes('info') || subtitle.includes('info')) {
    return {
      type: 'info',
      icon: <Info />,
      avatarContent: 'i',
      showIcon: true // Show info icon
    }
  } else if (title.includes('business') || subtitle.includes('company')) {
    return {
      type: 'business',
      icon: <Business />,
      avatarContent: 'B',
      showIcon: true
    }
  } else if (title.includes('campaign') || subtitle.includes('marketing')) {
    return {
      type: 'campaign',
      icon: <Campaign />,
      avatarContent: 'C',
      showIcon: true
    }
  } else {
    return {
      type: 'general',
      icon: <Notifications />,
      avatarContent: getAvatarContent(),
      showIcon: false // Use letter avatar for general notifications
    }
  }
}

// Alternative: Generate avatar based on notification ID for consistent colors
const getAvatarFromId = (id, title) => {
  const colors = [
    '#1976d2',
    '#388e3c',
    '#f57c00',
    '#d32f2f',
    '#7b1fa2',
    '#0288d1'
  ]
  const index = id ? id.length % colors.length : 0
  const letter = title ? title.charAt(0).toUpperCase() : '?'

  return {
    backgroundColor: colors[index],
    letter: letter
  }
}

// Priority badge component
const PriorityBadge = styled(({ notification, ...props }) => {
  const title = notification.title?.toLowerCase() || ''
  const isUrgent = title.includes('urgent') || title.includes('important')

  if (!isUrgent) return null

  return <Box {...props}>Priority</Box>
})(({ theme }) => ({
  background: theme.palette.warning.main,
  color: 'white',
  padding: '2px 8px',
  borderRadius: '12px',
  fontSize: '0.7rem',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
}))

export default function NotificationBar({ container }) {
  const { settings } = useSettings()
  const [panelOpen, setPanelOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const {
    notifications,
    createNotification,
    getNotifications,
    transferLeadNotification
  } = useSocket()
  const [localNotifications, setLocalNotifications] = useState([])
  const [hiddenNotifications, setHiddenNotifications] = useState(new Set())
  const { notification: fcmNotification } = useFCM()
  const notificationRef = useRef(null)

  const handleSettingsToggle = () => setSettingsOpen(!settingsOpen)

  const handleDrawerToggle = () => {
    setPanelOpen(!panelOpen)
    if (!panelOpen) {
      getNotifications()
      setHiddenNotifications(new Set())
    }
  }

  const markAsRead = async (notificationId, isRead, notificationType) => {
    try {
      await axiosInstance.patch('/api/announcements/mark-as-read', {
        id: notificationId,
        isRead,
        type: notificationType
      })

      // If marking as read, refresh notifications to remove it from the list
      if (isRead) {
        getNotifications()
      } else {
        // If marking as unread, just update the local state
        setLocalNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, isRead } : notif
          )
        )
      }
    } catch (error) {
      console.error('Failed to update notification read status:', error)
    }
  }

  const temporarilyHideNotification = (notificationId, e) => {
    e.preventDefault()
    e.stopPropagation()
    setHiddenNotifications((prev) => new Set([...prev, notificationId]))
  }

  const handleCheckboxClick = (e) => {
    e.stopPropagation()
  }

  const visibleNotifications = localNotifications?.filter(
    (notif) => !hiddenNotifications.has(notif.id)
  )

  const unreadCount = localNotifications?.filter(
    (notif) => !notif.isRead && !hiddenNotifications.has(notif.id)
  ).length

  useEffect(() => {
    setLocalNotifications(notifications)
  }, [notifications])

  useEffect(() => {
    if (transferLeadNotification) {
      createNotification({
        id: shortid.generate(),
        heading: 'Lead Alert',
        icon: {
          name: 'notifications',
          color: 'info'
        },
        timestamp: new Date(),
        title: 'New Lead Alert',
        subtitle: `You have received a new lead from ${transferLeadNotification?.name}`,
        path: 'leads',
        isRead: false
      })
    }
  }, [transferLeadNotification])

  // Removed createNotification from dependencies

  useEffect(() => {
    getNotifications()
  }, [])

  // Cleanup notification ref on unmount
  useEffect(() => {
    return () => {
      notificationRef.current = null
    }
  }, [])

  return (
    <Fragment>
      <IconButton onClick={handleDrawerToggle}>
        <Badge color="secondary" badgeContent={unreadCount}>
          <Notifications sx={{ color: 'text.primary' }} />
        </Badge>
      </IconButton>

      <ThemeProvider theme={settings.themes[settings.activeTheme]}>
        <Drawer
          width={'100px'}
          container={container}
          variant="temporary"
          anchor={'right'}
          open={panelOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          PaperProps={{
            sx: {
              backgroundColor: 'background.paper'
            }
          }}
        >
          <Box sx={{ width: sideNavWidth }}>
            <Notification>
              <Notifications color="primary" />
              <h5>Notifications</h5>
              {unreadCount > 0 && (
                <Box
                  sx={{
                    ml: 'auto',
                    background: 'rgba(0,0,0,0.1)',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}
                >
                  {unreadCount} new
                </Box>
              )}
            </Notification>

            <Box
              sx={{
                padding: '0 16px',
                maxHeight: 'calc(100vh - 120px)',
                overflowY: 'auto'
              }}
            >
              {visibleNotifications?.map((notification) => {
                const meta = getNotificationMeta(notification)
                // Alternative approach using ID-based avatar
                const idBasedAvatar = getAvatarFromId(
                  notification.id,
                  notification.title
                )

                return (
                  <NotificationCard key={notification?.id}>
                    <DeleteButton
                      className="deleteButton"
                      onClick={(e) =>
                        temporarilyHideNotification(notification.id, e)
                      }
                    >
                      <Clear fontSize="small" />
                    </DeleteButton>

                    <Link
                      to={`/${notification.path}`}
                      onClick={handleDrawerToggle}
                      style={{ textDecoration: 'none' }}
                    >
                      <NotificationContent elevation={2}>
                        <StatusIndicator
                          status={notification.isRead ? 'read' : 'unread'}
                        />

                        <CardHeader>
                          {/* Method 1: Content-based avatar */}
                          <NotificationAvatar notifType={meta.type}>
                            {meta.showIcon ? meta.icon : meta.avatarContent}
                          </NotificationAvatar>

                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mb: 0.5
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontWeight: '600',
                                  color: 'text.primary',
                                  fontSize: '0.9rem'
                                }}
                              >
                                {notification.title}
                              </Typography>
                              <PriorityBadge notification={notification} />
                            </Box>

                            <Typography
                              variant="body2"
                              sx={{
                                color: 'text.secondary',
                                fontSize: '0.8rem',
                                lineHeight: 1.4,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}
                            >
                              {notification.subtitle}
                            </Typography>
                          </Box>
                        </CardHeader>

                        <CardContent>
                          <TimeAndAction>
                            <Small
                              className="messageTime"
                              sx={{
                                fontSize: '0.75rem',
                                color: 'text.secondary',
                                fontWeight: '500'
                              }}
                            >
                              {moment(notification.timestamp).fromNow()}
                            </Small>

                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={notification.isRead || false}
                                  onChange={(e) =>
                                    markAsRead(
                                      notification.id,
                                      e.target.checked,
                                      notification.type
                                    )
                                  }
                                  onClick={handleCheckboxClick}
                                  color="primary"
                                  size="small"
                                  sx={{
                                    '&.Mui-checked': {
                                      color: '#4CAF50'
                                    }
                                  }}
                                />
                              }
                              onClick={handleCheckboxClick}
                              sx={{
                                margin: 0,
                                '& .MuiFormControlLabel-label': {
                                  fontSize: '0.75rem',
                                  color: 'text.secondary'
                                }
                              }}
                              label="Read"
                            />
                          </TimeAndAction>
                        </CardContent>
                      </NotificationContent>
                    </Link>
                  </NotificationCard>
                )
              })}

              {visibleNotifications?.length === 0 && (
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 4,
                    color: 'text.secondary'
                  }}
                >
                  <Notifications
                    sx={{ fontSize: '3rem', opacity: 0.3, mb: 2 }}
                  />
                  <Typography variant="body2">
                    No notifications to display
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Drawer>
      </ThemeProvider>

      <NotificationSettings
        open={settingsOpen}
        onClose={handleSettingsToggle}
      />
    </Fragment>
  )
}
