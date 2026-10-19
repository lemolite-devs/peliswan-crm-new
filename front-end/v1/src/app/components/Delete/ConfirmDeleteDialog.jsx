import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Box,
  Slide
} from '@mui/material'
import WarningIcon from '@mui/icons-material/Warning'
import { positions, styled } from '@mui/system'

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '16px',
    padding: theme.spacing(2),
    boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.1)',
    position: 'relative',
    top: '-15%'
  }
}))

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />
})

const ConfirmDeleteDialog = ({ open, onConfirm, onCancel, itemName }) => {
  return (
    <StyledDialog
      open={open}
      onClose={onCancel}
      fullWidth={true}
      maxWidth="sm"
      TransitionComponent={Transition}
    >
      <DialogContent>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
          textAlign="center"
          sx={{ padding: '16px' }}
        >
          {/* Warning Icon */}
          <WarningIcon
            sx={{ fontSize: 60, color: 'red', marginBottom: '16px' }}
          />

          {/* Main Message */}
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Confirm Delete
          </Typography>

          {/* Delete Description */}
          <Typography variant="body1" gutterBottom sx={{ color: '#555' }}>
            Are you sure you want to delete <b>{itemName}</b>? This action
            cannot be undone.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', padding: '16px' }}>
        {/* Cancel Button */}
        <Button
          onClick={onCancel}
          variant="outlined"
          color="secondary"
          sx={{ minWidth: 120, borderRadius: '8px' }}
        >
          No
        </Button>

        {/* Confirm Button */}
        <Button
          onClick={onConfirm}
          color="primary"
          variant="contained"
          sx={{ minWidth: 120, borderRadius: '8px', marginLeft: '16px' }}
        >
          Yes
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default ConfirmDeleteDialog
