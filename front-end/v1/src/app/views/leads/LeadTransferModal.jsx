import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  Button,
  MenuItem,
  CircularProgress,
  FormControl,
  InputLabel,
  Select
} from '@mui/material'
import { Formik, Form, ErrorMessage } from 'formik'
import * as Yup from 'yup'

import { HandleError } from 'app/utils/handleError'
import { useSnackbar } from 'app/snakebarContext'
import { useNavigate } from 'react-router-dom'

const validationSchema = Yup.object({
  transferWith: Yup.string().required('Please select a user to share with.')
})

const LeadTransferModal = ({
  isTransferModalOpen,
  handleCloseTransferModal,
  allSalesExecutives,
  handleShareLeads
}) => {
  const { showSnackbar } = useSnackbar()
  const navigate = useNavigate()

  return (
    <Dialog
      open={isTransferModalOpen}
      onClose={handleCloseTransferModal}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle id="form-dialog-title">Transfer Lead</DialogTitle>

      <Formik
        initialValues={{
          transferWith: ''
        }}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting, resetForm }) => {
          try {
            setSubmitting(true)
            await handleShareLeads(values)
            resetForm()
          } catch (error) {
            HandleError(error, showSnackbar, navigate)
            setSubmitting(false)
          } finally {
            setSubmitting(false)
          }
        }}
      >
        {({
          isSubmitting,
          handleChange,
          handleBlur,
          values,
          errors,
          touched
        }) => (
          <Form>
            <DialogContent>
              <DialogContentText>
                Please choose a sales executive from the list below to share the
                selected leads with. This will allow the chosen sales executive
                to access and collaborate on the shared leads.{' '}
              </DialogContentText>

              <FormControl fullWidth margin="normal">
                <InputLabel id="role-label">Transfer With</InputLabel>
                <Select
                  name="transferWith"
                  labelId="transfer-with-label"
                  label="Transfer With"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.transferWith}
                  error={Boolean(errors.transferWith && touched.transferWith)}
                >
                  {allSalesExecutives?.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name}
                    </MenuItem>
                  ))}
                </Select>
                <ErrorMessage
                  name="transferWith"
                  component="div"
                  style={{
                    color: '#FF3D57',
                    fontWeight: 400,
                    fontSize: '0.75rem',
                    lineHeight: 1.66,
                    letterSpacing: '0.03333em',
                    textAlign: 'left',
                    marginTop: '3px',
                    marginRight: '14px',
                    marginBottom: '0',
                    marginLeft: '14px'
                  }}
                />
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={handleCloseTransferModal}
                variant="contained"
                color="secondary"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? <CircularProgress size={18} /> : 'Share'}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  )
}

export default LeadTransferModal
