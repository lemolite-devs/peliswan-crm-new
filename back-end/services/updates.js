import mongoose from 'mongoose'
import { Updates } from '../models/index.js'
import Joi from 'joi'

const updatesSchema = Joi.object({
  message: Joi.string().required().max(800).trim().messages({
    'string.empty': 'Message cannot be empty',
    'string.max': 'Message cannot be longer than 800 characters',
    'any.required': 'Message is required'
  })
})

const validateUpdate = (data) =>
  updatesSchema.validate(data, { abortEarly: false })

export const getUpdates = async (request, reply) => {
  try {
    const updates = await Updates.find()
      .sort({ createdAt: -1 })
      .limit(70)
      .populate({ path: 'updatedBy', select: 'name' })

    reply.code(200).send({ success: true, updates })
  } catch (error) {
    console.log('serices : updates.js > getUpdates :: ', error)
    reply.code(500).send({ message: 'Internal Server Error' })
  }
}

export const newUpdate = async (request, reply) => {
  const { error } = validateUpdate(request.body)
  if (error) {
    const errorMessages = error.details.map((err) => err.message)
    return reply
      .code(400)
      .send({ message: 'Validation Error', errors: errorMessages })
  }

  try {
    const update = new Updates({
      ...request.body,
      updatedBy: request?.user.userId
    })
    await update.save()
    reply.code(201).send({ success: true, update })
  } catch (error) {
    console.log('serices : updates.js > newUpdate :: ', error)
    reply.code(500).send({ success: false, message: 'Internal Server Error' })
  }
}

export const updateModifyById = async (request, reply) => {
  const { error } = validateUpdate(request.body)
  if (error) {
    const errorMessages = error.details.map((err) => err.message)
    return reply
      .code(400)
      .send({ message: 'Validation Error', errors: errorMessages })
  }
  try {
    const { updateId } = request.params

    if (!mongoose.Types.ObjectId.isValid(updateId)) {
      return reply.code(400).send({ message: 'Invalid ID format.' })
    }

    const update = await Updates.findByIdAndUpdate(
      updateId,
      { ...request.body, updatedBy: request?.user.userId },
      {
        new: true
      }
    )
    reply.code(200).send({ success: true, update })
  } catch (error) {
    console.log('serices : updates.js > updateModifyById :: ', error)
    reply.code(500).send({ success: false, message: 'Internal Server Error' })
  }
}

export const deleteUpdateById = async (request, reply) => {
  try {
    const { updateId } = request.params

    if (!mongoose.Types.ObjectId.isValid(updateId)) {
      return reply.code(400).send({ message: 'Invalid ID format.' })
    }

    const update = await Updates.findById(updateId)

    if (!update) {
      return reply.code(404).send({ message: 'Update not found.' })
    }

    await Updates.findByIdAndDelete(updateId)

    reply
      .code(200)
      .send({ success: true, message: 'Update successfully deleted.' })
  } catch (error) {
    console.log('serices : updates.js > deleteUpdateById :: ', error)
    reply.code(500).send({ success: false, message: 'Internal Server Error' })
  }
}
