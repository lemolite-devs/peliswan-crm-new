import React from 'react'
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  Badge,
  Divider,
  useTheme
} from '@mui/material'
import ChatAvatar from 'app/components/ChatAvatar'

const UserList = ({ users, selectedUser, onUserSelect }) => {
  const theme = useTheme()

  // Helper function to format last seen time
  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return ''

    const now = new Date()
    const lastSeenDate = new Date(lastSeen)
    const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} hours ago`
    if (diffInMinutes < 2880) return 'Yesterday'
    return lastSeenDate.toLocaleDateString()
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

  const handleUserClick = (user) => {
    onUserSelect(user)
  }

  return (
    <List
      sx={{
        p: 0,
        overflow: 'auto',
        height: '100vh',
        '&::-webkit-scrollbar': { display: 'none' }
      }}
    >
      {users.map((user, index) => (
        <React.Fragment key={user.id}>
          <ListItem
            button
            onClick={() => handleUserClick(user)}
            sx={{
              backgroundColor:
                selectedUser?.id === user.id
                  ? 'action.selected'
                  : 'transparent',
              '&:hover': {
                backgroundColor: 'action.hover'
              },
              py: 2,
              px: 3
            }}
          >
            <ListItemAvatar>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor:
                        user.status === 'online' ? 'success.main' : 'grey.400',
                      border: '2px solid white'
                    }}
                  />
                }
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: getAvatarColor(user.name),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '1rem'
                  }}
                >
                  {getInitials(user.name)}
                </Box>
              </Badge>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: selectedUser?.id === user.id ? 600 : 400,
                      color:
                        selectedUser?.id === user.id
                          ? 'primary.main'
                          : 'text.primary'
                    }}
                  >
                    {user.name}
                  </Typography>
                  {user.unreadCount > 0 && (
                    <Badge
                      badgeContent={user.unreadCount}
                      color="primary"
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '0.75rem',
                          minWidth: 20,
                          height: 20
                        }
                      }}
                    />
                  )}
                </Box>
              }
              secondary={
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color:
                        user.unreadCount > 0
                          ? 'text.primary'
                          : 'text.secondary',
                      fontWeight: user.unreadCount > 0 ? 500 : 400,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {user.lastMessage}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.75rem'
                    }}
                  >
                    {user.status === 'online'
                      ? user.lastMessageTime
                      : user.lastSeen
                        ? `Last seen ${formatLastSeen(user.lastSeen)}`
                        : user.lastMessageTime}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
          {index < users.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </List>
  )
}

export default UserList
