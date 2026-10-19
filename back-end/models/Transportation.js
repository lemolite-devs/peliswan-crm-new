import mongoose, { Schema } from 'mongoose'

const transportationSchema = new Schema(
  {
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true
    },
    from: {
      type: String,
      required: [true, 'From location is required'],
      trim: true
    },
    km: {
      type: Number,
      required: [true, 'Distance (KM) is required'],
      min: [0, 'Distance cannot be negative']
    },
    rent: {
      type: Number,
      default: null,
      min: [0, 'Rent cannot be negative']
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'user'
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'user'
    }
  },
  {
    timestamps: true
  }
)

const Transportation = mongoose.model('Transportation', transportationSchema)

export default Transportation
