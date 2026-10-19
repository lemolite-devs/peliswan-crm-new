import Clients from '../models/Clients.js'
import Joi from 'joi'
import mongoose from 'mongoose'
import Address from '../models/Address.js'

// Custom validator for ObjectId
const objectIdValidator = (value, helper) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helper.message({ custom: 'Invalid ObjectId' })
  }
  return value
}

// Validation schema
const clientValidationSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Name must be at least 3 characters long.',
    'string.max': 'Name must be less than or equal to 100 characters long.',
    'any.required': 'Name is required.',
    'string.empty': 'Name is required.'
  }),
  companyName: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Company name must be at least 3 characters long.',
    'string.max':
      'Company name must be less than or equal to 100 characters long.',
    'any.required': 'Company name is required.',
    'string.empty': 'Company name is required.'
  }),
  gstNumber: Joi.string().required().messages({
    'any.required': 'GST number is required.',
    'string.empty': 'GST number is required.'
  }),
  contactInfo: Joi.object({
    phone: Joi.string().min(10).max(15).required().messages({
      'string.min': 'Phone number must be at least 10 characters long.',
      'string.max':
        'Phone number must be less than or equal to 15 characters long.',
      'any.required': 'Phone number is required.',
      'string.empty': 'Phone number is required.'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Email must be a valid email address.',
      'any.required': 'Email is required.',
      'string.empty': 'Email is required.'
    }),
    address: Joi.string().required().messages({
      'any.required': 'Address is required.',
      'string.empty': 'Address is required.'
    }),
    state: Joi.string().min(2).max(50).required().messages({
      'string.min': 'State must be at least 2 characters long.',
      'string.max': 'State must be less than or equal to 50 characters long.',
      'any.required': 'State is required.',
      'string.empty': 'State is required.'
    }),
    city: Joi.string().min(2).max(50).required().messages({
      'string.min': 'City must be at least 2 characters long.',
      'string.max': 'City must be less than or equal to 50 characters long.',
      'any.required': 'City is required.',
      'string.empty': 'City is required.'
    }),
    zipCode: Joi.string().allow('').optional()
  }).required(),
  products: Joi.array()
    .items(Joi.string().custom(objectIdValidator))
    .min(1)
    .max(10)
    .required()
    .messages({
      'array.min': 'Products must contain at least 1 item.',
      'array.max': 'Products can contain at most 10 items.',
      'any.required': 'Products are required.',
      'array.includes': 'Products must be valid ObjectIds.'
    }),
  competitors: Joi.string().allow('').optional(),
  quantity: Joi.number().min(1).required().messages({
    'number.min': 'Quantity must be at least 1.',
    'any.required': 'Quantity is required.',
    'string.empty': 'Quantity is required.'
  }),
  comments: Joi.string().allow('').optional(),
  billingAddress: Joi.string().required().messages({
    'string.empty': 'Billing address cannot be empty.'
  }),
  billingCity: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Billing city must be at least 2 characters long.',
    'string.max':
      'Billing city must be less than or equal to 50 characters long.',
    'any.required': 'Billing city is required.',
    'string.empty': 'Billing city is required.'
  }),
  billingState: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Billing state must be at least 2 characters long.',
    'string.max':
      'Billing state must be less than or equal to 50 characters long.',
    'any.required': 'Billing state is required.',
    'string.empty': 'Billing state is required.'
  }),
  billingZipCode: Joi.string().required().messages({
    'any.required': 'Billing zip code is required.',
    'string.empty': 'Billing zip code is required.'
  }),
  shippingAddress: Joi.string().required().messages({
    'string.empty': 'Shipping address cannot be empty.'
  }),
  shippingCity: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Shipping city must be at least 2 characters long.',
    'string.max':
      'Shipping city must be less than or equal to 50 characters long.',
    'any.required': 'Shipping city is required.',
    'string.empty': 'Shipping city is required.'
  }),
  shippingState: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Shipping state must be at least 2 characters long.',
    'string.max':
      'Shipping state must be less than or equal to 50 characters long.',
    'any.required': 'Shipping state is required.',
    'string.empty': 'Shipping state is required.'
  }),
  shippingZipCode: Joi.string().required().messages({
    'any.required': 'Shipping zip code is required.',
    'string.empty': 'Shipping zip code is required.'
  }),
  date: Joi.date().optional(),
  isBillingAndShippingSame: Joi.boolean().optional(),
  isActive: Joi.boolean().optional()
})

// GET APIs

// GET ALL clients
export const getClients = async (request, reply) => {
  try {
    const { page = 1, limit = 10, name, state, city, products } = request.query // Default to page 1 and limit 10

    const filter = {}

    if (name) {
      filter.name = { $regex: name, $options: 'i' }
    }
    if (state) {
      filter['contactInfo.state'] = state
    }

    if (city) {
      filter['contactInfo.city'] = city
    }
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'items', // the collection name of the 'items' collection
          localField: 'products',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      {
        $addFields: {
          productDetails: {
            $map: {
              input: '$productDetails',
              as: 'product',
              in: {
                name: '$$product.name' // Include only the 'name' field
              }
            }
          }
        }
      },
      {
        $match: products
          ? {
              'productDetails.name': {
                $in: products.split(',').map((p) => new RegExp(p, 'i'))
              }
            }
          : {}
      },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: Number(limit) }
    ]

    const clients = await Clients.aggregate(pipeline).exec()

    const countPipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'items',
          localField: 'products',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      {
        $addFields: {
          productDetails: {
            $map: {
              input: '$productDetails',
              as: 'product',
              in: {
                name: '$$product.name'
              }
            }
          }
        }
      },
      {
        $match: products
          ? {
              'productDetails.name': {
                $in: products.split(',').map((p) => new RegExp(p, 'i'))
              }
            }
          : {}
      },
      { $count: 'totalCount' }
    ]
    const totalCountResult = await Clients.aggregate(countPipeline).exec()
    const totalClients = totalCountResult[0]?.totalCount || 0
    reply.code(200).send({
      message: 'Client Data Fetched Successfully',
      clients,
      totalPages: Math.ceil(totalClients / limit),
      currentPage: Number(page),
      totalClients
    })
  } catch (error) {
    reply.code(500).send({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

// GET client by ID
export const getClientById = async (request, reply) => {
  try {
    const { clientId } = request.params
    const client = await Clients.findById(clientId).populate({
      path: 'products',
      select: 'name'
    })
    if (!client) {
      return reply.code(404).send({ message: 'Client not found' })
    }
    reply.code(200).send({ message: 'Client Data Fetch Successfully', client })
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}

// POST API
export const addClient = async (request, reply) => {
  try {
    const clientData = request.body

    // Validate client data
    const { error } = clientValidationSchema.validate(clientData, {
      abortEarly: false
    })
    if (error) {
      const errorMessages = error.details.map((err) => err.message)
      return reply
        .code(400)
        .send({ message: 'Validation Error', errors: errorMessages })
    }

    let billAddress = {
      address: clientData.billingAddress,
      state: clientData.billingState,
      city: clientData.billingCity,
      zipCode: clientData.billingZipCode
    }
    let shipAddress = {}

    if (clientData.isBillingAndShippingSame) {
      shipAddress = { ...billAddress }
    } else {
      shipAddress = {
        address: clientData.shippingAddress,
        state: clientData.shippingState,
        city: clientData.shippingCity,
        zipCode: clientData.shippingZipCode
      }
    }

    clientData.shippingAddress = shipAddress
    clientData.billingAddress = billAddress

    // Create and save the new client
    const newClient = new Clients(clientData)
    await newClient.save()
    reply.code(201).send({ message: 'Client Created Successfully' })
  } catch (error) {
    console.log('error :>', error)

    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}

// PUT API for update clients details
export const updateClientDetails = async (request, reply) => {
  try {
    const { clientId } = request.params
    const clientData = request.body

    // Validate client data
    const { error } = clientValidationSchema.validate(clientData, {
      abortEarly: false
    })

    if (error) {
      const errorMessages = error.details.map((err) => err.message)
      return reply
        .code(400)
        .send({ message: 'Validation Error', errors: errorMessages })
    }

    // Find the client by ID
    const client = await Clients.findById(clientId)

    if (!client) {
      return reply.code(404).send({ message: 'Client not found' })
    }

    let billAddress = {
      address: clientData.billingAddress || client?.billingAddress.address,
      state: clientData.billingState || client?.billingAddress.state,
      city: clientData.billingCity || client?.billingAddress.city,
      zipCode: clientData.billingZipCode || client?.billingAddress.zipCode
    }
    let shipAddress = {}
    // Update the billing and shipping addresses
    if (clientData.isBillingAndShippingSame) {
      shipAddress = { ...billAddress }
    } else {
      shipAddress = {
        address: clientData.shippingAddress || client?.shippingAddress.address,
        state: clientData.shippingState || client?.shippingAddress.address,
        city: clientData.shippingCity || client?.shippingAddress.address,
        zipCode: clientData.shippingZipCode || client?.shippingAddress.address
      }
    }

    // Update other client details
    Object.assign(client, {
      name: clientData.name,
      companyName: clientData.companyName,
      gstNumber: clientData.gstNumber,
      contactInfo: clientData.contactInfo,
      products: clientData.products,
      competitors: clientData.competitors,
      quantity: clientData.quantity,
      comments: clientData.comments,
      isBillingAndShippingSame: clientData.isBillingAndShippingSame,
      isActive: clientData.isActive,
      billingAddress: billAddress,
      shippingAddress: shipAddress
    })

    await client.save()

    reply.code(200).send({ message: 'Client Updated Successfully' })
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}

// DELETE API dor delete client details
export const deleteClient = async (request, reply) => {
  try {
    const { clientId } = request.params
    const deletedClient = await Clients.findByIdAndDelete(clientId)

    if (!deletedClient) {
      return reply.code(404).send({ message: 'Client not found' })
    }
    reply.code(200).send({ message: 'Client Deleted Successfully' })
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}
