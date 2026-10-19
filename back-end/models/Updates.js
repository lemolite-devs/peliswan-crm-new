import mongoose from 'mongoose'

const updatesSchema = new mongoose.Schema(
  {
    message: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    isRead: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
)

const Updates = mongoose.model('update', updatesSchema)
export default Updates
