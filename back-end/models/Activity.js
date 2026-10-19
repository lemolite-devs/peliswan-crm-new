// models/exampleModel.js
import mongoose, { Schema } from 'mongoose'

const activitySchema = new mongoose.Schema(
  {
    lead: { type: Schema.Types.ObjectId, ref: 'lead', required: true },
    description: String
  },
  {
    timestamps: true
  }
)

const Address = mongoose.model('activity', activitySchema)
export default Address
