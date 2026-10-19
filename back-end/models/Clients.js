import mongoose, { Schema } from 'mongoose'

const clientSchema = new mongoose.Schema(
  {
    name: String,
    companyName: String,
    gstNumber: String,
    contactInfo: {
      phone: String,
      email: String,
      address: String,
      state: String,
      city: String,
      zipCode: String
    },
    products: [{ type: Schema.Types.ObjectId, ref: 'item' }],
    competitors: String,
    competitorRate: { type: Number, default: null },
    quantity: Number,
    comments: String,
    billingAddress: {
      address: String,
      state: String,
      city: String,
      zipCode: String
    },
    shippingAddress: {
      address: String,
      state: String,
      city: String,
      zipCode: String
    },
    date: { type: Date },
    isActive: { type: Boolean, default: false },
    // interactionHistory: [{ type: Schema.Types.ObjectId, ref: "Interaction" }],
    leads: [{ type: Schema.Types.ObjectId, ref: 'lead' }],
    isBillingAndShippingSame: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
)

const Clients = mongoose.model('client', clientSchema)
export default Clients
