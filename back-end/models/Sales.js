import mongoose, { Schema } from 'mongoose'

const addressSchema = new Schema({
  address: { type: String, required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  zipCode: { type: String, required: true }
})

const salesSchema = new Schema(
  {
    customerName: {
      type: String,
      required: true
    },
    tankerNo: { type: String, required: true },
    invoiceNo: { type: String, required: true },
    companyName: { type: String, required: true },
    product: { type: Schema.Types.ObjectId, ref: 'item', required: true },
    quantity: {
      type: Number,
      required: true
    },
    unit: { type: String, enum: ['KL', 'MTS'], required: true },
    date: {
      type: Date,
      required: false
    },
    density: {
      type: Number,
      required: true
    },
    fullRate: {
      type: Number,
      required: true
    },
    day: {
      type: Number,
      required: true
    },
    month: {
      type: Number,
      required: true
    },
    year: {
      type: Number,
      required: true
    },
    addedBy: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'lead',
      required: false,
      default: null
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'customer',
      required: false,
      default: null
    },
    billingAddress: {
      companyName: { type: String, required: false },
      address: { type: String, required: false },
      state: { type: String, required: false },
      city: { type: String, required: false },
      zipCode: { type: String, required: false }
    },
    shippingAddress: {
      companyName: { type: String, required: false },
      address: { type: String, required: false },
      state: { type: String, required: false },
      city: { type: String, required: false },
      zipCode: { type: String, required: false }
    },
    gstBillName: { type: String, required: false },
    gstBillPdf: { type: Buffer, required: false }
  },
  {
    timestamps: true
  }
)

const Sales = mongoose.model('sale', salesSchema)
export default Sales
