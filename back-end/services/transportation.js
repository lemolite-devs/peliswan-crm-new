import Transportation from '../models/Transportation.js'
import Joi from 'joi'

// Validation schema
const transportationValidationSchema = Joi.object({
  location: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Location must be at least 2 characters long.',
    'string.max': 'Location must be less than or equal to 100 characters long.',
    'any.required': 'Location is required.',
    'string.empty': 'Location is required.'
  }),
  from: Joi.string().min(2).max(100).required().messages({
    'string.min': 'From location must be at least 2 characters long.',
    'string.max':
      'From location must be less than or equal to 100 characters long.',
    'any.required': 'From location is required.',
    'string.empty': 'From location is required.'
  }),
  km: Joi.number().min(0).required().messages({
    'number.base': 'Distance (KM) must be a valid number.',
    'number.min': 'Distance cannot be negative.',
    'any.required': 'Distance (KM) is required.'
  }),
  rent: Joi.number().min(0).allow(null, '').optional().messages({
    'number.base': 'Rent must be a valid number.',
    'number.min': 'Rent cannot be negative.'
  })
})

// Get all transportation routes
export const getTransportationRoutes = async (req, reply) => {
  try {
    const routes = await Transportation.find()
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 })

    return {
      success: true,
      data: routes,
      total: routes.length
    }
  } catch (error) {
    return {
      success: false,
      message: 'Error fetching transportation routes',
      error: error.message
    }
  }
}

// Get transportation route by ID
export const getTransportationRouteById = async (req, reply) => {
  try {
    const { id } = req.params

    if (!id) {
      return reply.code(400).send({
        success: false,
        message: 'Route ID is required'
      })
    }

    const route = await Transportation.findById(id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')

    if (!route) {
      return reply.code(404).send({
        success: false,
        message: 'Transportation route not found'
      })
    }

    return {
      success: true,
      data: route
    }
  } catch (error) {
    return {
      success: false,
      message: 'Error fetching transportation route',
      error: error.message
    }
  }
}

// Add new transportation route
export const addTransportationRoute = async (req, reply) => {
  try {
    const { error, value } = transportationValidationSchema.validate(req.body)

    if (error) {
      return reply.code(400).send({
        success: false,
        message: 'Validation error',
        details: error.details[0].message
      })
    }

    const newRoute = new Transportation({
      location: value.location,
      from: value.from,
      km: value.km,
      rent: value.rent || null,
      createdBy: req.user?.id
    })

    await newRoute.save()

    const populatedRoute = await Transportation.findById(newRoute._id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')

    return reply.code(201).send({
      success: true,
      message: 'Transportation route added successfully',
      data: populatedRoute
    })
  } catch (error) {
    return {
      success: false,
      message: 'Error adding transportation route',
      error: error.message
    }
  }
}

// Update transportation route
export const updateTransportationRoute = async (req, reply) => {
  try {
    const { id } = req.params
    const { error, value } = transportationValidationSchema.validate(req.body)

    if (error) {
      return reply.code(400).send({
        success: false,
        message: 'Validation error',
        details: error.details[0].message
      })
    }

    if (!id) {
      return reply.code(400).send({
        success: false,
        message: 'Route ID is required'
      })
    }

    const route = await Transportation.findByIdAndUpdate(
      id,
      {
        location: value.location,
        from: value.from,
        km: value.km,
        rent: value.rent || null,
        updatedBy: req.user?.id
      },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')

    if (!route) {
      return reply.code(404).send({
        success: false,
        message: 'Transportation route not found'
      })
    }

    return {
      success: true,
      message: 'Transportation route updated successfully',
      data: route
    }
  } catch (error) {
    return {
      success: false,
      message: 'Error updating transportation route',
      error: error.message
    }
  }
}

// Delete transportation route
export const deleteTransportationRoute = async (req, reply) => {
  try {
    const { id } = req.params

    if (!id) {
      return reply.code(400).send({
        success: false,
        message: 'Route ID is required'
      })
    }

    const route = await Transportation.findByIdAndDelete(id)

    if (!route) {
      return reply.code(404).send({
        success: false,
        message: 'Transportation route not found'
      })
    }

    return {
      success: true,
      message: 'Transportation route deleted successfully',
      data: route
    }
  } catch (error) {
    return {
      success: false,
      message: 'Error deleting transportation route',
      error: error.message
    }
  }
}

// Bulk upload transportation routes
export const bulkUploadTransportationRoutes = async (req, reply) => {
  try {
    const routes = req.body

    if (!Array.isArray(routes)) {
      return reply.code(400).send({
        success: false,
        message: 'Routes must be an array'
      })
    }

    const uploadedRoutes = []
    const errors = []

    for (let i = 0; i < routes.length; i++) {
      const { error, value } = transportationValidationSchema.validate(
        routes[i]
      )

      if (error) {
        errors.push({
          row: i + 1,
          message: error.details[0].message
        })
        continue
      }

      const newRoute = new Transportation({
        location: value.location,
        from: value.from,
        km: value.km,
        rent: value.rent || null,
        createdBy: req.user?.id
      })

      await newRoute.save()
      uploadedRoutes.push(newRoute)
    }

    return reply.code(201).send({
      success: true,
      message: `${uploadedRoutes.length} routes uploaded successfully`,
      uploaded: uploadedRoutes.length,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      data: uploadedRoutes
    })
  } catch (error) {
    return {
      success: false,
      message: 'Error uploading transportation routes',
      error: error.message
    }
  }
}
