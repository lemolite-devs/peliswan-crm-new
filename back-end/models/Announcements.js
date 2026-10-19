import mongoose from 'mongoose'

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    isRead: { type: Boolean, default: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true }
  },
  {
    timestamps: true
  }
)

const Announcements = mongoose.model('announcement', announcementSchema)
export default Announcements
