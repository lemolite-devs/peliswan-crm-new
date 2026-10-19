import mongoose, { Schema } from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    userID: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: Schema.Types.ObjectId, ref: 'role', required: true },
    mobileNumber: { type: String, required: true },
    city: { type: String },
    iv: { type: String },
    refreshToken: { type: String },
    fcmToken: { type: String },
    notificationSettings: {
      chat: { type: Boolean, default: true },
      leads: { type: Boolean, default: true },
      announcements: { type: Boolean, default: true },
      tasks: { type: Boolean, default: true }
    }
  },
  {
    timestamps: true
  }
)

const Users = mongoose.model('user', userSchema)
export default Users
