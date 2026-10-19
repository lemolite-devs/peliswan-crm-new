import mongoose from 'mongoose'

const counterSchema = new mongoose.Schema({
  entity: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 } // Last used count for the entity
})

const Counter = mongoose.model('counter', counterSchema)

export default Counter
