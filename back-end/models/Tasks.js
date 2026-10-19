// models/exampleModel.js
import mongoose, { Schema } from 'mongoose'

const taskSchema = new mongoose.Schema(
  {
    name: String,
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low']
    },
    startDate: Date,
    dueDate: Date,
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
      default: 'Not Started'
    },
    assignedTo: [{ type: Schema.Types.ObjectId, ref: 'user' }],
    description: {
      type: String,
      required: false
    }
  },
  {
    timestamps: true
  }
)

const Tasks = mongoose.model('task', taskSchema)
export default Tasks
