// models/exampleModel.js
import mongoose from 'mongoose'

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    permissions: [String] // Optional: List of permissions for each role
  },
  {
    timestamps: true
  }
)

const Roles = mongoose.model('role', roleSchema)
export default Roles
