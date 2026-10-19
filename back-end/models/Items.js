import mongoose, { Schema } from 'mongoose'

const itemSchema = new Schema(
  {
    name: String,
    description: String,
    rate: Number,
    gst: { type: Number, default: 18, enum: [18, 12, 5] },
    units: {
      type: String,
      enum: ['KL', 'MTS']
    },
    group: {
      type: String,
      enum: ['oil', 'solvent', 'glycols', 'aromatics', 'plastic granules']
    },
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
)

const Items = mongoose.model('item', itemSchema)
export default Items
