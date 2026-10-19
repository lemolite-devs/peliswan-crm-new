import mongoose from 'mongoose'

const salesTargetSchema = new mongoose.Schema(
  {
    salesExecutiveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      require: true
    },
    targetQuantity: {
      type: Number,
      require: true
    },
    saleQuantity: {
      type: Number,
      default: 0
    },
    unit: {
      type: String,
      enum: ['KL', 'MTS'],
      require: true
    },
    month: {
      type: Number,
      require: true
    },
    year: {
      type: Number,
      require: true
    },
    state: {
      type: String
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      require: true
    }
  },
  {
    timestamps: true // Automatically add createdAt and updatedAt fields
  }
)

const SalesTarget = mongoose.model('SalesTarget', salesTargetSchema)

export default SalesTarget
