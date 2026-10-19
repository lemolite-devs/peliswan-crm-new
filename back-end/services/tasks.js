import { Tasks } from '../models/index.js'
import mongoose from 'mongoose'
import Joi from 'joi'

// Define task schema for validation
const taskSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Name must be at least 3 characters long.',
    'string.max': 'Name can be at most 100 characters long.',
    'any.required': 'Name is required.',
    'string.empty': 'Name cannot be empty.'
  }),
  priority: Joi.string().valid('Low', 'Medium', 'High').required().messages({
    'any.required': 'Priority is required.',
    'string.empty': 'Priority cannot be empty.',
    'any.only': 'Priority must be one of Low, Medium, High.'
  }),
  startDate: Joi.date().required().messages({
    'any.required': 'Start Date is required.',
    'date.base': 'Start Date must be a valid date.'
  }),
  dueDate: Joi.date().required().messages({
    'any.required': 'Due Date is required.',
    'date.base': 'Due Date must be a valid date.'
  }),
  status: Joi.string()
    .valid('Not Started', 'In Progress', 'Completed')
    .required()
    .messages({
      'any.required': 'Status is required.',
      'string.empty': 'Status cannot be empty.',
      'any.only': 'Status must be one of Not Started, In Progress, Completed.'
    }),

  assignedTo: Joi.array().items(Joi.string().required()).messages({
    'any.required': 'Assigned To is required.',
    'string.empty': 'Assigned To cannot be empty.',
    'array.items': 'Assigned To must be an array of strings.'
  }),
  description: Joi.string().max(500).allow('').optional().messages({
    'string.max': 'Description can be at most 500 characters long.'
  })
})

// Function to validate task data
const validateTask = (data) => taskSchema.validate(data, { abortEarly: false })

export const newTask = async (request, reply) => {
  const { error } = validateTask(request.body)
  if (error) {
    const errorMessages = error.details.map((err) => err.message)
    return reply
      .code(400)
      .send({ message: 'Validation Error', errors: errorMessages })
  }

  try {
    const task = new Tasks(request.body)
    await task.save()
    reply.code(201).send({ success: true, task })
  } catch (error) {
    reply.code(500).send({ success: false, message: 'Internal Server Error' })
  }
}

export const getAllTasks = async (request, reply) => {
  try {
    const {
      page = 1,
      rowPerPage = 10,
      search = null,
      status = null,
      priority = null
    } = request.query
    const skip = (page - 1) * rowPerPage

    // Create a filter object based on the search query
    const filter = {}

    // Check if the user role is 'executive'
    if (request.user.role === 'Sales Executive') {
      filter.assignedTo = request.user.userId // Assuming userId is the ID of the user
    }

    if (search) {
      filter.$or = [{ name: { $regex: search, $options: 'i' } }]
    }

    if (status) {
      filter.status = { $regex: status, $options: 'i' }
    }

    if (priority) {
      filter.priority = { $regex: priority, $options: 'i' }
    }

    const tasks = await Tasks.find(filter)
      .populate({ path: 'assignedTo', select: 'name' })
      .select('name priority startDate dueDate status assignedTo description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(rowPerPage)

    const totalTasks = await Tasks.countDocuments(filter)
    const totalPages = Math.ceil(totalTasks / rowPerPage)

    reply.send({ tasks, totalTasks, totalPages })
  } catch (error) {
    reply.code(500).send({ message: 'Failed to fetch tasks.' })
  }
}

export const getTaskById = async (request, reply) => {
  const { userId } = request.params

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return reply.code(400).send({ message: 'Invalid userId format' })
  }

  try {
    const task = await Tasks.findById(userId)
      .populate('assignedTo')
      .select('name priority startDate dueDate status assignedTo description')

    if (!task) {
      return reply.code(404).send({ message: 'Task not found' })
    }

    reply.code(200).send({ message: 'Task data fetched successfully', task })
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}

export const deleteTaskById = async (request, reply) => {
  const { userId } = request.params

  // Validate ID format (assuming a simple check for MongoDB ObjectId)
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return reply.code(400).send({ message: 'Invalid user ID format.' })
  }

  try {
    const result = await Tasks.findByIdAndDelete(userId)
    if (!result) {
      return reply.code(404).send({ message: 'Task not found.' })
    }

    reply.code(200).send({ message: 'Task successfully deleted.' })
  } catch (error) {
    reply.code(500).send({ message: 'Failed to delete task.' })
  }
}

export const updateTaskById = async (request, reply) => {
  const { userId } = request.params

  const isValidAssignedTo = Array.isArray(request.body?.assignedTo)
    ? request.body?.assignedTo?.every((id) =>
        mongoose.Types.ObjectId.isValid(id)
      )
    : mongoose.Types.ObjectId.isValid(request.body?.assignedTo)

  if (!isValidAssignedTo) {
    return reply.code(400).send({ message: 'Assigned To Invalid format.' })
  }

  const { error } = validateTask(request.body)
  if (error) {
    const errorMessages = error.details.map((err) => err.message)
    return reply
      .code(400)
      .send({ message: 'Validation Error', errors: errorMessages })
  }

  try {
    const task = await Tasks.findById(userId)
    if (!task) {
      return reply.code(404).send({ message: 'Task not found.' })
    }

    const updatedTask = await Tasks.findByIdAndUpdate(userId, request.body, {
      new: true,
      runValidators: true
    })

    reply.code(200).send(updatedTask)
  } catch (error) {
    reply.code(500).send({ message: 'Failed to update task.' })
  }
}

export const updateTaskFieldById = async (request, reply) => {
  const { userId } = request.params
  const { field, value } = request.body

  // Validate userId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return reply.code(400).send({ message: 'Invalid userId format.' })
  }

  // Validate field and value
  if (!field || !['status', 'priority'].includes(field)) {
    return reply.code(400).send({
      message: 'Only "status" or "priority" are allowed.'
    })
  }
  if (value === undefined) {
    return reply.code(400).send({
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required.`
    })
  }

  try {
    const task = await Tasks.findById(userId)
    if (!task) {
      return reply.code(404).send({ message: 'Task not found.' })
    }

    const updateObject = { [field]: value }
    const updatedTask = await Tasks.findByIdAndUpdate(
      userId,
      { $set: updateObject },
      {
        new: true,
        runValidators: true
      }
    )

    reply.code(200).send(updatedTask)
  } catch (error) {
    reply.code(500).send({ message: 'Failed to update task.' })
  }
}
export const getAllStatusTasks = async (request, reply) => {
  try {
    const role = request.user?.role
    const userId = request.user?.userId

    // Define match filter
    const matchFilter = {}

    if (role === 'Sales Executive') {
      matchFilter.assignedTo = new mongoose.Types.ObjectId(userId)
    }

    const statusCounts = await Tasks.aggregate([
      {
        $match: matchFilter // Apply the filter for Sales Executive role
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    const counts = {
      'Not Started': 0,
      'In Progress': 0,
      Completed: 0
    }

    statusCounts.forEach((statusCount) => {
      counts[statusCount._id] = statusCount.count
    })

    reply.code(200).send(counts)
  } catch (error) {
    console.log('Error:', error)
    reply.code(500).send({ message: 'Failed to fetch status.' })
  }
}
