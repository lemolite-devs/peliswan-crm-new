import React, { useState } from 'react'
import {
  TextField,
  Button,
  Box,
  Typography,
  DialogActions
} from '@mui/material'

const SettingsForm = ({ onFromSubmit }) => {
  // Define the state for form fields
  const [formData, setFormData] = useState({
    type: '',
    description: ''
  })

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    setFormData({ type: '', description: '' })
    onFromSubmit()
  }

  return (
    <>
      {/* Type field */}
      <TextField
        label="Type"
        variant="outlined"
        name="type"
        value={formData.type}
        onChange={handleChange}
        fullWidth
        required
      />

      {/* Description field */}
      <TextField
        label="Description"
        variant="outlined"
        name="description"
        value={formData.description}
        onChange={handleChange}
        fullWidth
        required
        multiline
        rows={5}
      />

      {/* Save button */}
      <DialogActions>
        <Button type="submit" variant="contained" color="primary">
          Save
        </Button>
        <Button variant="contained" color="secondary">
          Cancel
        </Button>
      </DialogActions>
    </>
  )
}

export default SettingsForm
