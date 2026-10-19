import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Switch,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material'
import { Notifications, NotificationsOff } from '@mui/icons-material'
import axiosInstance from 'axiosInstance'
import useFCM from 'app/hooks/useFCM'

const NotificationSettings = ({ open, onClose }) => {
  const [settings, setSettings] = useState({
    chat: true,
    leads: true,
    announcements: true,
    tasks: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const { permission, requestPermission } = useFCM()

  // Load current notification settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await axiosInstance.get('/api/notifications/settings')
        setSettings(response.data.data.notificationSettings)
      } catch (error) {
        console.error('Error loading notification settings:', error)
      }
    }

    if (open) {
      loadSettings()
    }
  }, [open])

  // Handle setting change
  const handleSettingChange = (setting) => (event) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: event.target.checked
    }))
  }

  // Save settings
  const handleSave = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Request permission if not granted
      if (permission !== 'granted') {
        const granted = await requestPermission()
        if (!granted) {
          setError(
            'Notification permission is required to receive notifications'
          )
          setLoading(false)
          return
        }
      }

      // Update settings on server
      await axiosInstance.put('/api/notifications/settings', settings)

      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error) {
      setError('Failed to update notification settings')
      console.error('Error updating notification settings:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle close
  const handleClose = () => {
    setError(null)
    setSuccess(false)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Notifications color="primary" />
          <Typography variant="h6">Notification Settings</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Notification settings updated successfully!
          </Alert>
        )}

        {permission === 'denied' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Notification permission is denied. Please enable notifications in
            your browser settings.
          </Alert>
        )}

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Choose which notifications you want to receive:
          </Typography>

          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.chat}
                  onChange={handleSettingChange('chat')}
                  disabled={loading}
                />
              }
              label="Chat Messages"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              Receive notifications for new chat messages
            </Typography>
          </Box>

          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.leads}
                  onChange={handleSettingChange('leads')}
                  disabled={loading}
                />
              }
              label="Lead Updates"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              Receive notifications for lead status changes and assignments
            </Typography>
          </Box>

          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.announcements}
                  onChange={handleSettingChange('announcements')}
                  disabled={loading}
                />
              }
              label="Announcements"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              Receive notifications for company announcements
            </Typography>
          </Box>

          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.tasks}
                  onChange={handleSettingChange('tasks')}
                  disabled={loading}
                />
              }
              label="Task Reminders"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              Receive notifications for task deadlines and updates
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default NotificationSettings
