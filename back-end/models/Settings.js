import mongoose, { Schema } from 'mongoose'

const settingsSchema = new Schema(
  {
    key: String,
    value: Schema.Types.Mixed // can be any type of data (e.g., JSON)
  },
  {
    timestamps: true
  }
)

const Settings = mongoose.model('setting', settingsSchema)
export default Settings
