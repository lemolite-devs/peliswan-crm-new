import mongoose from 'mongoose'
import Items from '../models/Items.js'
import Joi from 'joi'
const itemValidationSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Name must be at least 3 characters long.',
    'string.max': 'Name must be less than or equal to 100 characters long.',
    'any.required': 'Name is required.',
    'string.empty': 'Name is required.'
  }),
  description: Joi.string().min(3).max(300).required().messages({
    'string.min': 'Description must be at least 3 characters long.',
    'string.max':
      'Description must be less than or equal to 300 characters long.',
    'any.required': 'Description is required.',
    'string.empty': 'Description is required.'
  }),
  rate: Joi.number().min(0).required().messages({
    'number.min': 'Rate must be at least 0.',
    'any.required': 'Rate is required.',
    'number.empty': 'Rate is required.'
  }),
  gst: Joi.number().valid(18, 12, 5).default(18).messages({
    'any.only': 'GST must be one of the following: 18, 12, 5.'
  }),
  units: Joi.string().valid('KL', 'MTS').required().messages({
    'any.only': 'Units must be one of the following: KL, MTS.',
    'any.required': 'Units are required.',
    'string.empty': 'Units are required.'
  }),
  group: Joi.string()
    .valid('oil', 'solvent', 'glycols', 'aromatics', 'plastic granules')
    .required()
    .messages({
      'any.only':
        'Group must be one of the following: oil, solvent, glycols, aromatics, plastic granules.',
      'any.required': 'Group is required.',
      'string.empty': 'Group is required.'
    })
})

//GET API

// GET all items
export const getItem = async (request, reply) => {
  try {
    // Return items sorted by order
    const orderedItems = await Items.find().sort({ order: 1 })

    reply.code(200).send(orderedItems)
  } catch (error) {
    reply.code(500).send({ message: 'Failed to fetch items' })
  }
}

//GET Item By ID
export const getItemById = async (request, reply) => {
  try {
    const { itemId } = request.params
    const item = await Items.findById(itemId).exec()

    if (!item) {
      return reply.code(404).send({ message: 'Item not found' })
    }

    reply.code(200).send({ message: 'Item Fetched Successfully', item })
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}

// POST API for creating an item
export const addItem = async (request, reply) => {
  try {
    const itemData = request.body
    // Validate item data
    const { error } = itemValidationSchema.validate(itemData, {
      abortEarly: false
    })
    if (error) {
      const errorMessages = error.details.map((err) => err.message)
      return reply
        .code(400)
        .send({ message: 'Validation Error', errors: errorMessages })
    }

    const newItem = new Items(itemData)

    await newItem.save()
    reply.code(201).send({ message: 'Item Created Successfully' })
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}

// PUT API for updating an item
export const updateItem = async (request, reply) => {
  try {
    const { itemId } = request.params
    const itemData = request.body

    // Validate item data
    const { error } = itemValidationSchema.validate(itemData, {
      abortEarly: false
    })
    if (error) {
      const errorMessages = error.details.map((err) => err.message)
      return reply
        .code(400)
        .send({ message: 'Validation Error', errors: errorMessages })
    }

    const updatedItem = await Items.findByIdAndUpdate(itemId, itemData, {
      new: true
    })

    if (!updatedItem) {
      return reply.code(404).send({ message: 'Item not found' })
    }

    reply.code(200).send({ message: 'Item Updated Successfully' })
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}

//DELETE API for delete item
export const deleteItem = async (request, reply) => {
  try {
    const { itemId } = request.params
    const result = await Items.findByIdAndDelete(itemId)

    if (!result) {
      return reply.code(404).send({ message: 'Item not found' })
    }

    reply.code(200).send({ message: 'Item Deleted' })
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}

// lookUp api for the getting item-name and item-id
export const lookUpItems = async (request, reply) => {
  try {
    const items = await Items.find().select('name _id').exec()
    const mappedItems = items.map((item) => ({
      key: item._id,
      value: item.name
    }))
    reply
      .code(200)
      .send({ message: 'Item Fetch Successfully', items: mappedItems })
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}

export const reorderItems = async (request, reply) => {
  try {
    const { itemId, sourceIndex, destinationIndex } = request.body

    // Update orders for all affected items
    if (sourceIndex < destinationIndex) {
      await Items.updateMany(
        {
          order: {
            $gt: sourceIndex,
            $lte: destinationIndex
          }
        },
        { $inc: { order: -1 } }
      )
    } else {
      await Items.updateMany(
        {
          order: {
            $gte: destinationIndex,
            $lt: sourceIndex
          }
        },
        { $inc: { order: 1 } }
      )
    }

    // Update moved item's order
    await Items.findByIdAndUpdate(itemId, { order: destinationIndex })

    reply.code(200).send({ message: 'Order updated successfully' })
  } catch (error) {
    reply.code(500).send({ message: 'Failed to update order' })
  }
}
