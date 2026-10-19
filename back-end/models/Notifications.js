import mongoose, { Schema } from 'mongoose'

const notificationSchema = new Schema(
  {
    message: String,
    user: { type: Schema.Types.ObjectId, ref: 'user' },
    dueDate: Date
  },
  {
    timestamps: true
  }
)

const Notifications = mongoose.model('notification', notificationSchema)
export default Notifications
