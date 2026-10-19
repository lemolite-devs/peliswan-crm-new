import * as Yup from 'yup'
import {
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  Button,
  CircularProgress
} from '@mui/material'
import { Formik, Form } from 'formik'

import InputTextField from '../InputFields/InputTextField'

// Update Validation Schema
const updateValidationSchema = Yup.object({
  message: Yup.string()
    .max(800, 'Message can not be longer than 800 characters.')
    .required('Message is required')
})

const UpdateForm = ({
  open,
  handleClose,
  handleUpdate,
  initialUpdate,
  isSubmitting,
  submitingFinish
}) => {
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="form-dialog-title"
      fullWidth
    >
      <DialogTitle id="form-dialog-title">
        {initialUpdate ? 'Edit Update' : 'Add Update'}
      </DialogTitle>

      <Formik
        initialValues={{
          message: initialUpdate ? initialUpdate?.message : ''
        }}
        validationSchema={updateValidationSchema}
        onSubmit={(values, { resetForm }) => {
          handleUpdate(values)
          isSubmitting.setSubmitting(true)
          if (!isSubmitting.submitting) {
            if (submitingFinish) {
              resetForm()
              handleClose()
            }
          }
        }}
      >
        {({ handleChange, handleBlur, values, errors, touched }) => (
          <Form>
            <DialogContent>
              {/* form fields */}
              <InputTextField
                id="message"
                name="message"
                label="Message"
                margin="dense"
                rows={4}
                formik={{ values, handleChange, handleBlur, errors, touched }}
              />
            </DialogContent>
            <DialogActions>
              <Button
                onClick={handleClose}
                variant="contained"
                color="secondary"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting.submitting}
              >
                {isSubmitting.submitting ? (
                  <CircularProgress size={18} />
                ) : initialUpdate ? (
                  'Save Changes'
                ) : (
                  'Save'
                )}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  )
}

export default UpdateForm
