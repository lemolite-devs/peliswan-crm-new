import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Box,
  Slide,
  styled
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

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

const ReminderConfirmDialog = ({
  open,
  onConfirm,
  onCancel,
  title = 'Confirm Action',
  message = 'Do you want to mark this reminder as read?'
}) => {
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
          {/* Check Icon */}
          <CheckCircleIcon
            sx={{ fontSize: 60, color: 'green', marginBottom: '16px' }}
          />

          {/* Main Message */}
          <Typography variant="h6" gutterBottom fontWeight="bold">
            {title}
          </Typography>

          {/* Description */}
          <Typography variant="body1" gutterBottom sx={{ color: '#555' }}>
            {message}
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

export default ReminderConfirmDialog
