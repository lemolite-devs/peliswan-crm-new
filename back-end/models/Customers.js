import mongoose, { Schema } from 'mongoose'

const CustomerSchema = new Schema(
  {
    date: {
      type: Date,
      required: false
    },
    addedBy: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'lead',
      required: false,
      default: null
    },
    salesOrders: [
      {
        type: Schema.Types.ObjectId,
        ref: 'sale',
        required: false,
        default: null
      }
    ]
  },
  {
    timestamps: true
  }
)

const Customers = mongoose.model('customer', CustomerSchema)
export default Customers
