// models/exampleModel.js
import mongoose from 'mongoose'

const addressSchema = new mongoose.Schema(
  {
    address: String,
    state: String,
    city: String,
    zipCode: String
  },
  {
    timestamps: true
  }
)

const Address = mongoose.model('address', addressSchema)
export default Address
