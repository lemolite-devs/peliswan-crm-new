import mongoose, { Schema } from 'mongoose'

const callSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'customer', required: true },
    date: { type: Date, default: Date.now },
    duration: { type: Number }, // duration in seconds
    notes: { type: String }, // notes about the call
    status: {
      type: String,
      enum: ['completed', 'pending', 'failed'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
)

const Calls = mongoose.model('call', callSchema)
export default Calls
