import Leads, { REPRESENTATIVE_TYPES } from '../models/Leads.js'
import {
  COUNTRY_NAMES,
  DIAL_CODES,
  DEFAULT_COUNTRY,
  DEFAULT_DIAL_CODE,
  SUPPORTED_COUNTRIES
} from '../models/States.js'
import Joi from 'joi'
import mongoose from 'mongoose'
import Clients from '../models/Clients.js'
import Settings from '../models/Settings.js'
import Users from '../models/Users.js'
import XLSX from 'xlsx'
import fs from 'fs'
import Customers from '../models/Customers.js'
import stream from 'stream'
import util from 'util'
import Items from '../models/Items.js'
import moment from 'moment'

const pump = util.promisify(stream.pipeline)

// Resolves a lead's dial code, falling back to its country's code (and then
// India's) for records created before `phoneCountryCode` existed.
export const resolveDialCode = (lead) =>
  lead?.phoneCountryCode ||
  SUPPORTED_COUNTRIES.find((c) => c.name === (lead?.country || DEFAULT_COUNTRY))
    ?.dialCode ||
  DEFAULT_DIAL_CODE

// The same 10 digits under two different dial codes are two different phones,
// so duplicate checks are scoped by dial code. Omitting the code keeps the old
// digits-only behaviour for callers that don't send one. Legacy leads predate
// the field, so a +91 lookup must also match documents without it.
export const buildDialCodeQuery = (phoneCountryCode) => {
  if (!phoneCountryCode || !DIAL_CODES.includes(phoneCountryCode)) return {}

  return {
    phoneCountryCode:
      phoneCountryCode === DEFAULT_DIAL_CODE
        ? { $in: [phoneCountryCode, null] }
        : phoneCountryCode
  }
}

// Custom validator for ObjectId
export const objectIdValidator = (value, helper) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helper.message({ custom: 'Invalid ObjectId' })
  }
  return value
}

// Validation schema
const leadValidationSchema = Joi.object({
  customerName: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Customer name must be at least 3 characters long.',
    'string.max':
      'Customer name must be less than or equal to 100 characters long.',
    'any.required': 'Customer name is required.',
    'string.empty': 'Customer name is required.'
  }),
  companyName: Joi.array()
    .items(Joi.string().min(3).max(100).allow('', null))
    .optional(),

  mobileNumber: Joi.array()
    .items(Joi.string().min(10).max(15))
    .required()
    .messages({
      'array.min': 'At least one mobile number is required.',
      'string.min': 'Mobile number must be at least 10 characters long.',
      'string.max':
        'Mobile number must be less than or equal to 15 characters long.',
      'any.required': 'Mobile number is required.',
      'string.empty': 'Mobile number is required.'
    }),
  // gstDetails: Joi.array()
  //   .items(
  //     Joi.object({
  //       name: Joi.string().allow('').optional(),
  //       file: Joi.any().optional()
  //     })
  //   )
  //   .optional(),
  email: Joi.string().email().allow('', null).optional(),
  country: Joi.string()
    .valid(...COUNTRY_NAMES)
    .default(DEFAULT_COUNTRY)
    .messages({
      'any.only': `Country must be one of the following: ${COUNTRY_NAMES.join(', ')}.`
    }),
  phoneCountryCode: Joi.string()
    .valid(...DIAL_CODES)
    .default(DEFAULT_DIAL_CODE)
    .messages({
      'any.only': `Phone country code must be one of the following: ${DIAL_CODES.join(', ')}.`
    }),
  // Postal-code length differs per country (India PIN is 6 digits, Nepal's is 5).
  zipCode: Joi.when('country', {
    switch: SUPPORTED_COUNTRIES.map(({ name, zipLength }) => ({
      is: name,
      then: Joi.string()
        .allow('', null)
        .pattern(new RegExp(`^[0-9]{${zipLength}}$`))
        .messages({
          'string.pattern.base': `Zip code must be ${zipLength} digits for ${name}.`
        })
    })),
    otherwise: Joi.string().allow('', null).min(5).max(10)
  }),
  status: Joi.string().required().messages({
    'any.required': 'Status is required.',
    'string.empty': 'Status is required.'
  }),
  state: Joi.string().min(2).max(50).required().messages({
    'string.min': 'State must be at least 2 characters long.',
    'string.max': 'State must be less than or equal to 50 characters long.',
    'any.required': 'State is required.',
    'string.empty': 'State is required.'
  }),
  city: Joi.string().min(2).max(50).optional(),
  products: Joi.array()
    .items(Joi.string().custom(objectIdValidator))
    .min(1)
    .max(10)
    .required()
    .messages({
      'array.min': 'Product must contain at least 1 item.',
      'array.max': 'Product can contain at most 10 items.',
      'any.required': 'Product is required.',
      'array.includes': 'Product must be valid ObjectIds.'
    }),
  representative: Joi.string()
    .valid(...REPRESENTATIVE_TYPES)
    .required()
    .messages({
      'any.only': `Representative must be one of the following: ${REPRESENTATIVE_TYPES.join(', ')}.`,
      'any.required': 'Representative is required.',
      'string.empty': 'Representative is required.'
    }),
  quantity: Joi.number().min(1).required().messages({
    'number.min': 'Quantity must be at least 1.',
    'any.required': 'Quantity is required.',
    'string.empty': 'Quantity is required.'
  }),
  competitorName: Joi.string().allow('').max(150).optional().messages({
    'string.max':
      'Competitor name must be less than or equal to 150 characters long.'
  }),
  competitorRate: Joi.number().min(0).allow(null).optional().messages({
    'number.min': 'Competitor rate cannot be negative.',
    'number.base': 'Competitor rate must be a number.'
  }),
  unit: Joi.string().min(1).max(50).required().messages({
    'string.min': 'Unit must be at least 1 character long.',
    'string.max': 'Unit must be less than or equal to 50 characters long.',
    'any.required': 'Unit is required.',
    'string.empty': 'Unit is required.'
  }),
  comments: Joi.string().allow('').max(300).optional().messages({
    'string.max': 'Remarks must be less than or equal to 300 characters long.',
    'any.required': 'Remarks are required.'
  }),
  reminders: Joi.array()
    .items(
      Joi.object({
        message: Joi.string().required(),
        dueDate: Joi.date().iso().required()
      })
    )
    .messages({
      'array.includes': 'Reminders must be valid.',
      'any.required': 'Reminders are required.',
      'string.empty': 'Reminders are required.'
    }),
  inquiries: Joi.string()
    .valid(
      'IndiaMART',
      'TradeIndia',
      'Facebook',
      'Whatsapp',
      'Instagram',
      'References'
    )
    .required()
    .messages({
      'any.only':
        'Inquiries must be one of the following: IndiaMART, TradeIndia, Facebook, Whatsapp, Instagram, References.',
      'any.required': 'Inquiries are required.',
      'string.empty': 'Inquiries are required.'
    }),
  assignedTo: Joi.string().custom(objectIdValidator).messages({
    'any.required': 'AssignedTo is required.',
    'string.empty': 'AssignedTo field is required.'
  }),
  activities: Joi.array()
    .items(
      Joi.object({
        description: Joi.string().required(),
        user: Joi.string().custom(objectIdValidator).required()
      })
    )
    .optional(),
  meeting: Joi.boolean().optional(),
  meetingType: Joi.string()
    .valid('regularMeeting', 'hotMeeting', '')
    .optional(),
  requestSample: Joi.boolean().optional(),
  visitPlant: Joi.boolean().optional(),
  visitOffice: Joi.boolean().optional(),
  remark: Joi.string()
    .valid(
      'No Answer',
      'Call Later',
      'Interested',
      'Not Interested',
      'Switch Off',
      'Other'
    )
    .optional()
    .messages({
      'any.only':
        'Remark must be one of the following: No Answer, Call later, Intrested, Not Intrested, Switch Off, Other.',
      'string.empty': 'Remark can be empty.'
    }),
  deliveryDestination: Joi.array()
    .items(Joi.string())
    .optional()
    .allow(null, ''),
  isCallTrue: Joi.boolean().optional()
})

//GET Leads
export const getLeadData = async (request, reply) => {
  const {
    page = 1,
    limit = 10,
    products,
    deliveryDestination,
    assignedTo,
    export: exportData
  } = request.query
  const filter = {}

  const currentUserId = request.user.userId

  if (request.user.role === 'Sales Executive') {
    filter.assignedTo = new mongoose.Types.ObjectId(currentUserId)
  }

  Object.keys(request.query).forEach((param) => {
    if (param === 'meeting') {
      if (request.query[param] === 'true') {
        filter.meeting = true
      }
    } else if (param === 'requestSample') {
      if (request.query[param] === 'true') {
        filter.requestSample = true
      }
    } else if (param === 'visitPlant') {
      if (request.query[param] === 'true') {
        filter.visitPlant = true
      }
    } else if (param === 'visitOffice') {
      if (request.query[param] === 'true') {
        filter.visitOffice = true
      }
    } else if (param === 'deliveryDestination') {
      const locationsArray = deliveryDestination
        .split(',')
        .map((location) => location.trim())
      filter.deliveryDestination = { $in: locationsArray }
    } else if (param === 'assignedTo') {
      filter.assignedTo = {
        $in: assignedTo?.split(',').map((a) => new mongoose.Types.ObjectId(a))
      }
    } else if (param === 'country') {
      const value = request.query[param]
      // Exact match (not the catch-all regex) so the `country` index is used.
      if (value?.trim() && COUNTRY_NAMES.includes(value.trim())) {
        filter.country = value.trim()
      }
    } else if (param === 'quantity') {
      const quantityValue = parseInt(request.query[param], 10)
      if (!isNaN(quantityValue)) {
        filter.quantity = quantityValue
      }
    } else if (param === 'status') {
      const value = request.query[param]
      if (value?.trim()) {
        // "Customer" isn't a real status value; it means converted leads.
        if (value === 'Customer') {
          filter.isCustomer = true
        } else {
          filter.status = { $regex: value, $options: 'i' }
        }
      }
    } else if (param === 'startDate') {
      const value = request.query[param]
      if (value?.trim()) {
        const startOfDayIST = moment
          .utc(value)
          .add(5, 'hours')
          .add(30, 'minutes')
          .startOf('day')
          .toDate()
        filter.createdAt = { ...(filter.createdAt || {}), $gte: startOfDayIST }
      }
    } else if (param === 'endDate') {
      const value = request.query[param]
      if (value?.trim()) {
        const endOfDayIST = moment
          .utc(value)
          .add(5, 'hours')
          .add(30, 'minutes')
          .endOf('day')
          .toDate()
        filter.createdAt = { ...(filter.createdAt || {}), $lte: endOfDayIST }
      }
    } else if (
      param !== 'page' &&
      param !== 'limit' &&
      param !== 'products' &&
      param !== 'export'
    ) {
      const searchValue = request.query[param]
      if (searchValue?.trim()) {
        if (param === 'combineField') {
          const fieldsToSearch = ['companyName', 'customerName', 'mobileNumber']

          const searchConditions = fieldsToSearch.map((field) => ({
            [field]: { $regex: searchValue, $options: 'i' }
          }))

          filter.$or = filter.$or
            ? [...filter.$or, ...searchConditions]
            : searchConditions
        } else if (param === 'commentSearch') {
          filter.comments = { $regex: searchValue, $options: 'i' }
        } else {
          filter[param] = { $regex: searchValue, $options: 'i' }
        }
      }
    }
  })

  try {
    const pipeline = [
      // Step 1: Filter Leads Collection Based on General Conditions
      { $match: filter },

      // Step 2: If 'products' filter is provided, filter by product IDs BEFORE lookup
      ...(products
        ? [
            {
              $match: {
                products: {
                  $in: products
                    .split(',')
                    .map((p) => new mongoose.Types.ObjectId(p))
                }
              }
            }
          ]
        : []),

      // Step 3: Sort by Latest Activity
      {
        $sort: { 'latestActivity.updatedAt': -1 }
      },

      // Step 4: Pagination (Only if exportData is false)
      ...(!exportData
        ? [{ $skip: (page - 1) * limit }, { $limit: Number(limit) }]
        : []),

      // Step 5: Lookup to Get Product Details
      {
        $lookup: {
          from: 'items',
          localField: 'products',
          foreignField: '_id',
          as: 'productDetails'
        }
      },

      // Step 6: Lookup to Get Assigned User Details
      {
        $lookup: {
          from: 'users',
          localField: 'assignedTo',
          foreignField: '_id',
          as: 'assignedToUser'
        }
      },

      // Step 7: Add Fields for Product Names and Assigned User Name
      {
        $project: {
          _id: 1,
          customerName: 1,
          mobileNumber: 1,
          companyName: 1,
          status: 1,
          country: 1,
          phoneCountryCode: 1,
          state: 1,
          city: 1,
          createdAt: 1,
          isCustomer: 1,
          history: 1,
          latestActivity: 1,
          assignedToName: { $arrayElemAt: ['$assignedToUser.name', 0] },
          productDetails: {
            $map: {
              input: '$productDetails',
              as: 'product',
              in: { name: '$$product.name' }
            }
          }
        }
      }
    ]

    const leads = await Leads.aggregate(pipeline).exec()

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}-${month}-${year}`
    }

    if (exportData) {
      const leadsData = leads.map((lead) => ({
        ['Customer Name']: lead.customerName,
        ['Company Name']: Array.isArray(lead?.companyName)
          ? lead.companyName.join(', ')
          : typeof lead?.companyName === 'string'
            ? lead.companyName
            : '',
        ['Mobile Number']:
          lead?.mobileNumber?.length > 0
            ? lead.mobileNumber
                .map((number) => `${resolveDialCode(lead)} ${number}`)
                .join(', ')
            : '',
        Date: formatDate(lead.createdAt),
        Status: lead.status,
        Country: lead.country || DEFAULT_COUNTRY,
        State: lead.state,
        City: lead.city,
        Products: lead.productDetails.map((product) => product.name).join(', '),
        Quantity: lead.quantity,
        'Assigned To': lead.assignedToName
      }))

      const worksheet = XLSX.utils.json_to_sheet(leadsData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads')

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

      reply
        .header(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        .header('Content-Disposition', 'attachment; filename="leads.xlsx"')
        .send(buffer)
    } else {
      const totalCountPipeline = [
        { $match: filter },
        ...(products
          ? [
              {
                $match: {
                  products: {
                    $in: products
                      .split(',')
                      .map((p) => new mongoose.Types.ObjectId(p))
                  }
                }
              }
            ]
          : []),

        { $count: 'totalCount' }
      ]

      const totalCountResult = await Leads.aggregate(totalCountPipeline).exec()
      const totalLeads = totalCountResult[0]?.totalCount || 0

      reply.code(200).send({
        message: 'Data fetched successfully',
        lead: leads,
        currentPage: Number(page),
        totalPages: Math.ceil(totalLeads / limit),
        totalLeads
      })
    }
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}

export const getLeadById = async (request, reply) => {
  try {
    const { leadId } = request.params
    const lead = await Leads.findById(leadId)
      .populate({
        path: 'products',
        select: 'name'
      })
      .populate({
        path: 'activities.user',
        select: 'name'
      })
      .populate({ path: 'assignedTo', select: 'name' })
      .exec()
    if (!lead) {
      return reply.code(404).send({ message: 'Lead not found' })
    }

    reply.code(200).send({ message: 'Lead Fetched Successfully', lead })
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}

export const existsMobileInLeads = async (request, reply) => {
  try {
    const { mobileNumbers, leadId, phoneCountryCode } = request.query
    const mobileNumberArray = mobileNumbers ? mobileNumbers.split(',') : []

    // Return early if no numbers to check
    if (!mobileNumberArray.length) {
      return reply.code(200).send({
        message: 'No mobile numbers provided to check',
        success: true
      })
    }

    const query = {
      mobileNumber: { $in: mobileNumberArray },
      ...buildDialCodeQuery(phoneCountryCode)
    }

    if (leadId) {
      query._id = { $ne: leadId }
    }

    const existingLeads = await Leads.find(query)
      .populate('addedBy', 'name')
      .exec()

    if (existingLeads.length > 0) {
      const existingLeadInfo = existingLeads.map((lead) => ({
        mobileNumber: lead.mobileNumber,
        addedBy: lead.addedBy?.name || 'Unknown'
      }))

      return reply.code(400).send({
        message: 'Mobile numbers already exist',
        existingLeads: existingLeadInfo
      })
    }

    return reply.code(200).send({
      message: 'Mobile numbers are available',
      success: true
    })
  } catch (error) {
    return reply.code(500).send({
      message: 'Internal server error',
      error: error.message
    })
  }
}

export const addLead = async (request, reply) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const { isCallTrue, ...leadData } = request.body
    const { userId } = request.user

    const validationResults = await Promise.all([
      leadValidationSchema.validate(leadData, { abortEarly: false }),
      typeof isCallTrue === 'boolean'
        ? Promise.resolve()
        : Promise.reject(new Error('isCallTrue must be a boolean.'))
    ])

    if (validationResults[0].error) {
      return reply.code(400).send({
        message: 'Validation Error',
        errors: validationResults[0].error.details.map((err) => err.message)
      })
    }

    const existingLeads = await Leads.find({
      mobileNumber: { $in: leadData.mobileNumber },
      ...buildDialCodeQuery(leadData.phoneCountryCode || DEFAULT_DIAL_CODE)
    })
      .select('addedBy')
      .populate('addedBy', 'name')
      .lean()
      .session(session)

    if (existingLeads.length > 0) {
      await session.abortTransaction()
      return reply.code(400).send({
        message: `This phone number already added by ${existingLeads[0].addedBy?.name || 'Unknown'}`
      })
    }

    const newLead = new Leads({
      ...leadData,
      addedBy: userId,
      assignedTo: userId,
      latestActivity: {
        updatedAt: new Date(),
        description: 'Created from add lead.'
      },
      activities: [
        {
          description: 'Created from add lead.',
          user: userId,
          isCallTrue,
          createdAt: new Date()
        }
      ]
    })

    const savedLead = await newLead.save({ session })
    await session.commitTransaction()

    return reply.code(201).send({
      success: true,
      message: 'Lead created successfully',
      lead: savedLead
    })
  } catch (error) {
    await session.abortTransaction()
    return reply.code(500).send({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    })
  } finally {
    session.endSession()
  }
}

export const deleteLead = async (request, reply) => {
  try {
    const { leadId } = request.params
    const result = await Leads.findByIdAndDelete(leadId)

    if (!result) {
      return reply.code(404).send({ message: 'Lead not found' })
    }

    reply.code(200).send({ message: 'Lead deleted successfully', result })
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}

export const updateLead = async (request, reply) => {
  try {
    const { leadId } = request.params
    const updateData = request.body
    const { userId } = request.user

    if (!mongoose.Types.ObjectId.isValid(leadId)) {
      return reply.code(400).send({
        success: false,
        message: 'Invalid leadId'
      })
    }

    const { error } = leadValidationSchema.validate(updateData, {
      abortEarly: false
    })
    if (error) {
      return reply.code(400).send({
        success: false,
        message: 'Validation Error',
        errors: error.details.map((detail) => detail.message)
      })
    }

    const session = await mongoose.startSession()
    let updatedLead

    await session.withTransaction(async () => {
      const [user, existingLead] = await Promise.all([
        Users.findById(userId).select('name').lean().session(session),
        Leads.findById(leadId).select('_id').lean().session(session)
      ])

      if (!existingLead) {
        throw new Error('Lead not found')
      }

      updatedLead = await Leads.findByIdAndUpdate(
        leadId,
        {
          $set: {
            ...updateData,
            'latestActivity.updatedAt': new Date(),
            'latestActivity.description': `Updated lead by user ${user?.name || 'N/A'}`
          },
          $push: {
            activities: {
              description: `Updated lead by user ${user?.name || 'N/A'}`,
              user: userId,
              createdAt: new Date()
            }
          }
        },
        {
          new: true,
          session,
          lean: true,
          runValidators: true
        }
      )
    })

    return reply.code(200).send({
      success: true,
      message: 'Lead updated successfully',
      data: updatedLead
    })
  } catch (error) {
    return reply.code(error.message === 'Lead not found' ? 404 : 500).send({
      success: false,
      message: error.message || 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// notification api

export const addGstDetails = async (request, reply) => {
  try {
    const { leadId } = request.params

    // Ensure leadId exists
    if (!leadId) {
      return reply.code(400).send({ message: 'Lead ID is required' })
    }

    // Parse multipart form-data
    const parts = await request.parts()
    const gstDetails = []

    // Process incoming fields and files
    for await (const part of parts) {
      if (part.file && part.fieldname.startsWith('file')) {
        // Extract the index from the fieldname (e.g., file[0], file[1])
        const match = part.fieldname.match(/file\[(\d+)\]/)
        if (match) {
          const index = match[1]
          const chunks = []
          for await (const chunk of part.file) {
            chunks.push(chunk)
          }

          const fileBuffer = Buffer.concat(chunks)

          gstDetails[index] = gstDetails[index] || {}
          gstDetails[index].uploadedFile = {
            filename: part.filename,
            contentType: part.mimetype,
            data: fileBuffer
          }
        }
      } else if (part.fieldname.startsWith('name')) {
        // Extract the index from the fieldname (e.g., name[0], name[1])
        const match = part.fieldname.match(/name\[(\d+)\]/)
        if (match) {
          const index = match[1]
          gstDetails[index] = gstDetails[index] || {}
          gstDetails[index].name = part.value
        }
      }
    }

    // Validate that all GST details have both a name and an uploadedFile
    const invalidEntries = gstDetails.filter(
      (detail) => !detail.name || !detail.uploadedFile
    )
    if (invalidEntries.length > 0) {
      return reply.code(400).send({
        message: 'Each GST detail must have a name and an uploaded file.'
      })
    }

    // Find the lead by ID
    const lead = await Leads.findById(leadId)
    if (!lead) {
      return reply.code(404).send({ message: 'Lead not found' })
    }

    // Add all GST details to the lead's gstDetails array
    lead.gstDetails.push(...gstDetails)

    // Save the updated lead document
    await lead.save()

    return reply.code(201).send({
      message: 'GST Details Added Successfully',
      gstDetails: lead.gstDetails
    })
  } catch (error) {
    if (error.statusCode === 413) {
      return reply.code(413).send({
        message: 'Request file too large',
        error: error.message || 'The uploaded file exceeds the size limit.'
      })
    }
    reply.code(500).send({
      message: error.message,
      error: error.message
    })
  }
}
export const updateGstDetails = async (request, reply) => {
  try {
    const { leadId } = request.params

    // Ensure leadId exists
    if (!leadId) {
      return reply.code(400).send({ message: 'Lead ID is required' })
    }

    // Parse multipart form-data
    const parts = await request.parts()
    const updatedGstDetails = []

    // Fetch the current GST details (this will be used to retain old files)
    const lead = await Leads.findById(leadId)
    if (!lead) {
      return reply.code(404).send({ message: 'Lead not found' })
    }

    // Process incoming fields and files
    for await (const part of parts) {
      if (part.file && part.fieldname.startsWith('file')) {
        // Extract the index from the fieldname (e.g., file[0], file[1])
        const match = part.fieldname.match(/file\[(\d+)\]/)
        if (match) {
          const index = match[1]
          const chunks = []
          for await (const chunk of part.file) {
            chunks.push(chunk)
          }

          const fileBuffer = Buffer.concat(chunks)

          updatedGstDetails[index] = updatedGstDetails[index] || {}
          updatedGstDetails[index].uploadedFile = {
            filename: part.filename,
            contentType: part.mimetype,
            data: fileBuffer
          }
        }
      } else if (part.fieldname.startsWith('name')) {
        // Extract the index from the fieldname (e.g., name[0], name[1])
        const match = part.fieldname.match(/name\[(\d+)\]/)
        if (match) {
          const index = match[1]
          updatedGstDetails[index] = updatedGstDetails[index] || {}
          updatedGstDetails[index].name = part.value

          // If no new file is uploaded, retain the old file
          if (!updatedGstDetails[index].uploadedFile) {
            updatedGstDetails[index].uploadedFile =
              lead.gstDetails[index]?.uploadedFile
          }
        }
      }
    }

    // Validate that all updated GST details have both a name and an uploadedFile
    const invalidEntries = updatedGstDetails.filter(
      (detail) => !detail.name || !detail.uploadedFile
    )
    if (invalidEntries.length > 0) {
      return reply.code(400).send({
        message: 'Each GST detail must have a name and an uploaded file.'
      })
    }

    // Replace existing GST details with the updated details
    lead.gstDetails = updatedGstDetails

    // Save the updated lead document
    await lead.save()

    return reply.code(200).send({
      message: 'GST Details Updated Successfully',
      gstDetails: lead.gstDetails
    })
  } catch (error) {
    console.error('Error:', error)
    reply.code(500).send({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

export const addBillingAndShippingAddress = async (request, reply) => {
  const { leadId } = request.params
  const addresses = request.body.addresses || []

  try {
    if (addresses.length === 0) {
      return reply.code(400).send({
        message: 'At least one address is required.'
      })
    }

    for (let address of addresses) {
      if (!address.billingAddress || !address.shippingAddress) {
        return reply.code(400).send({
          message:
            'Both billingAddress and shippingAddress are required for each address.'
        })
      }
    }

    const lead = await Leads.findById(leadId)
    if (!lead) {
      return reply.code(404).send({ message: 'Lead not found.' })
    }

    lead.addresses.push(...addresses)

    await lead.save()

    return reply.code(201).send({
      message: 'Multiple billing and shipping addresses added successfully.',
      lead
    })
  } catch (error) {
    console.error('Error adding addresses:', error)
    return reply.code(500).send({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}
export const updateBillingAndShippingAddress = async (request, reply) => {
  const { leadId } = request.params
  const addresses = request.body.addresses || []

  try {
    if (addresses.length === 0) {
      return reply.code(400).send({
        message: 'At least one address is required.'
      })
    }

    // Validate each address to ensure both billing and shipping addresses are provided
    for (let address of addresses) {
      if (!address.billingAddress || !address.shippingAddress) {
        return reply.code(400).send({
          message:
            'Both billingAddress and shippingAddress are required for each address.'
        })
      }
    }

    // Find the lead by ID
    const lead = await Leads.findById(leadId)
    if (!lead) {
      return reply.code(404).send({ message: 'Lead not found.' })
    }

    // Update the addresses for the lead
    lead.addresses = addresses // Replace the existing addresses with the new ones

    // Save the updated lead
    await lead.save()

    return reply.code(200).send({
      message: 'Billing and shipping addresses updated successfully.',
      lead
    })
  } catch (error) {
    console.error('Error updating addresses in Leads.js 760:', error)
    return reply.code(500).send({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

export const addNotification = async (request, reply) => {
  const { leadId } = request.params
  const { message, dueDate, baseDate } = request.body

  try {
    const lead = await Leads.findById(leadId)

    if (!lead) {
      return reply.code(404).send({ message: 'Lead not found' })
    }

    lead.reminders.push({
      message,
      dueDate,
      baseDate,
      user: request.user.userId
    })

    await lead.save()

    reply.code(201).send({ message: 'Notification Add Successfully', lead })
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Erorr', error: error.message })
  }
}

export const updateNotification = async (request, reply) => {
  const { leadId, reminderId } = request.params
  const { message, dueDate, baseDate } = request.body

  try {
    const lead = await Leads.findById(leadId)

    if (!lead) {
      return reply.code(404).send({ message: 'Lead not found' })
    }

    const notification = lead.reminders.id(reminderId)
    if (!notification) {
      return reply.status(404).send({ error: 'Notification not found' })
    }
    notification.message = message
    notification.dueDate = dueDate
    if (baseDate !== undefined) {
      notification.baseDate = baseDate
    }

    await lead.save()
    reply.code(200).send({ message: 'Notification Updated Successfully' })
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}

export const deleteNotification = async (request, reply) => {
  const { leadId, reminderId } = request.params
  try {
    const lead = await Leads.findById(leadId)

    if (!lead) {
      return reply.code(404).send({ message: 'Lead not found' })
    }

    // Find the index of the notification to remove
    const notificationIndex = lead.reminders.findIndex(
      (notification) => notification._id.toString() === reminderId
    )

    if (notificationIndex === -1) {
      return reply.code(404).send({ message: 'Notification not found' })
    }

    // Remove the notification from the array
    lead.reminders.splice(notificationIndex, 1)

    await lead.save()

    reply.code(200).send({ message: 'Notification deleted successfully' })
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}

export const markReminderAsRead = async (request, reply) => {
  const { reminderId } = request.params
  const { leadId } = request.body

  try {
    const lead = await Leads.findById(leadId)

    if (!lead) {
      return reply.code(404).send({ message: 'Lead not found' })
    }

    // Find the specific reminder and toggle its read status
    const reminder = lead.reminders.find(
      (reminder) => reminder._id.toString() === reminderId
    )

    if (!reminder) {
      return reply.code(404).send({ message: 'Reminder not found' })
    }

    // Toggle the isReadTrue flag
    reminder.isReadTrue = !reminder.isReadTrue

    await lead.save()

    reply.code(200).send({
      message: `Reminder ${reminder.isReadTrue ? 'marked as read' : 'marked as unread'} successfully`,
      success: true,
      isReadTrue: reminder.isReadTrue
    })
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}

const activitySchema = Joi.object({
  description: Joi.string().required().trim(),
  isCallTrue: Joi.boolean().required()
})

export const addActivity = async (request, reply) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const { leadId } = request.params
    const { description, isCallTrue } = request.body
    const { userId } = request.user

    // Input validation
    const { error } = activitySchema.validate({ description, isCallTrue })
    if (error) {
      return reply.code(400).send({
        success: false,
        message: 'Validation Error',
        errors: error.details.map((err) => err.message)
      })
    }

    // Check if lead exists
    const leadExists = await Leads.exists({ _id: leadId }).session(session)

    if (!leadExists) {
      await session.abortTransaction()
      return reply.code(404).send({
        success: false,
        message: 'Lead not found'
      })
    }

    const now = new Date()

    await Leads.updateOne(
      { _id: leadId },
      {
        $push: {
          activities: {
            user: userId,
            description: description.trim(),
            isCallTrue,
            createdAt: now
          }
        },
        $set: {
          latestActivity: {
            description: description.trim(),
            updatedAt: now
          }
        }
      },
      { session }
    )

    await session.commitTransaction()

    return reply.code(201).send({
      success: true,
      message: 'Activity added successfully'
    })
  } catch (error) {
    await session.abortTransaction()
    console.error('Error adding activity:', error)
    return reply.code(500).send({
      success: false,
      message: 'Error adding activity',
      error:
        process.env.NODE_ENV === 'development' ? error.stack : error.message
    })
  } finally {
    session.endSession()
  }
}

export const updateActivity = async (request, reply) => {
  const { leadId, activityId } = request.params
  const { description } = request.body

  try {
    const lead = await Leads.findById(leadId)
    if (!lead) {
      return reply.status(404).send({ error: 'Lead not found' })
    }

    const activity = lead.activities.id(activityId)
    if (!activity) {
      return reply.status(404).send({ error: 'Activity not found' })
    }

    activity.description = description

    await lead.save()
    reply.code(200).send({ message: 'Update activity successfully' })
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}

export const deleteActivity = async (request, reply) => {
  const { leadId, activityId } = request.params

  try {
    const lead = await Leads.findById(leadId)

    if (!lead) {
      return reply.code(404).send({ message: 'Lead not found' })
    }

    //Find the index of the activity to remove
    const activityIndex = lead.activities.findIndex(
      (activity) => activity._id.toString() === activityId
    )

    if (activityIndex === -1) {
      return reply.code(404).send({ message: 'Activity Not Found' })
    }

    //remove the activity from the array
    lead.activities.splice(activityIndex, 1)

    await lead.save()
    reply.code(200).send({ message: 'Activity Deleted.' })
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}

export const getActivityByLeadId = async (request, reply) => {
  try {
    const { leadId } = request.params
    const user = request.user // Assume `request.user` contains the logged-in user's data (id, role, etc.)

    // Find the lead by ID
    const lead = await Leads.findById(leadId).populate({
      path: 'activities.user',
      select: 'name'
    })

    if (!lead) {
      return reply.code(404).send({ message: 'Lead not found' })
    }

    // If the user's role is 'Sales Executive', filter activities by the logged-in user's ID
    let activities = lead.activities
    if (user.role === 'Sales Executive') {
      activities = activities.filter(
        (activity) => activity?.user?._id.toString() === user?.userId.toString()
      )
    }

    // Return the filtered activities
    reply.code(200).send(activities)
  } catch (error) {
    console.error('Error retrieving activities:', error)
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}

export const getAllActivities = async (request, reply) => {
  try {
    const limit = 30
    const { userId, role } = request.user

    const pipeline = [
      {
        $match: {
          'activities.0': { $exists: true },
          ...(role === 'Sales Executive' && {
            'activities.user': new mongoose.Types.ObjectId(userId)
          })
        }
      },

      { $unwind: '$activities' },
      { $sort: { 'activities.createdAt': -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'activities.user',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $project: {
          customerName: 1,
          activity: {
            description: '$activities.description',
            isCallTrue: '$activities.isCallTrue',
            createdAt: '$activities.createdAt',
            user: {
              $arrayElemAt: ['$userDetails.name', 0]
            }
          }
        }
      }
    ]

    const activities = await Leads.aggregate(pipeline)

    return reply.code(200).send({
      success: true,
      message: 'Latest activities fetched successfully',
      activities
    })
  } catch (error) {
    console.error('Error retrieving activities:', error)
    return reply.code(500).send({
      success: false,
      message: 'Internal Server Error',
      error:
        process.env.NODE_ENV === 'development' ? error.stack : error.message
    })
  }
}

export const convertToCustomer = async (request, reply) => {
  try {
    const leadId = request.params.leadId

    const leadData = await Leads.findById(leadId)
    if (!leadData) {
      return reply.code(404).send({ message: 'Lead not found' })
    }

    if (leadId) {
      leadData.isCustomer = true
      const response = await leadData.save()
      if (response?.isCustomer) {
        const customer = {
          customerName: leadId,
          date: new Date(),
          addedBy: request.user.role,
          user: request.user.userId,
          leadId: leadId,
          salesOrders: []
        }
        const newCustomer = new Customers(customer)
        await newCustomer.save()

        let activity = {
          lead: leadData._id,
          description: `Customer created `,
          user: request.user.userId
        }
        leadData.activities.push(activity)
        await leadData.save()
      }
    }

    const companyName = Array.isArray(leadData.companyName)
      ? leadData.companyName[0]
      : leadData.companyName
    const mobileNumber = Array.isArray(leadData.mobileNumber)
      ? leadData.mobileNumber[0]
      : leadData.mobileNumber

    const clientData = {
      name: leadData.customerName,
      companyName: companyName || '',
      gstNumber: '',
      contactInfo: {
        phone: mobileNumber || '',
        email: leadData.email,
        address: '',
        state: leadData.state,
        city: leadData.city,
        zipCode: leadData.zipCode
      },
      products: leadData.products,
      competitors: leadData.competitorName,
      competitorRate: leadData.competitorRate,
      quantity: leadData.quantity,
      comments: leadData.comments,
      billingAddress: null,
      shippingAddress: null,
      date: new Date(),
      isActive: false,
      leads: leadData._id
    }

    const newClient = new Clients(clientData)
    await newClient.save()

    reply.code(201).send({
      message: 'Lead converted to Client successfully'
      // client: newClient
    })
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}

export const getAllLeadOverviewData = async () => {
  try {
    const definitions = await Settings.findOne({ key: 'definition' })
    const statusTypes = definitions?.value?.map((i) => i.type) || []
    // Define the aggregation pipeline
    const pipeline = [
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 1,
          count: 1
        }
      }
    ]

    const data = await Leads.aggregate(pipeline) // Execute the aggregation pipeline

    // Convert aggregation result to a dictionary for quick lookup
    const statusCountMap = data.reduce((acc, item) => {
      acc[item._id] = item.count
      return acc
    }, {})

    // Generate the final result with all statuses, including those with zero count
    const result = statusTypes.map((status, index) => ({
      id: index,
      value: statusCountMap[status] || 0,
      label: status
    }))

    return result?.length > 0 ? result : []
  } catch (error) {
    console.error('Error : getAllLeadOverviewData --->', error)

    return {
      code: 500,
      error: 'An error occurred while fetching sales data.'
    }
  }
}

export const getAllReminders = async (request, reply) => {
  const user = request.user
  try {
    let query = {
      'reminders.0': { $exists: true },
      'reminders.isReadTrue': { $ne: true } // Only get unread reminders
    }

    if (user.role === 'Sales Executive') {
      query['activities.user'] = new mongoose.Types.ObjectId(user.userId)
    }

    const leadsWithReminders = await Leads.aggregate([
      {
        $match: query
      },
      {
        $project: {
          reminders: 1,
          customerName: 1
        }
      },
      {
        $unwind: '$reminders'
      },
      {
        $match: {
          'reminders.isReadTrue': { $ne: true }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'reminders.user',
          foreignField: '_id',
          as: 'reminderUser'
        }
      },
      {
        $addFields: {
          'reminders.customerName': '$customerName',
          'reminders.reminderId': '$_id', // Add lead ID for reference
          'reminders.addedBy': {
            $arrayElemAt: ['$reminderUser.name', 0]
          }
        }
      },
      {
        $group: {
          _id: '$_id',
          reminders: { $push: '$reminders' }
        }
      }
    ])

    reply.code(200).send({
      message: 'Reminders fetched successfully',
      reminders: leadsWithReminders
    })
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}

export const getLeadActivityGraphData = async (request, reply) => {
  try {
    // Get month and year from query parameters or use current month/year by default
    const currentDate = new Date()
    const month = request.query.month || currentDate.getMonth() + 1
    const year = request.query.year || currentDate.getFullYear()
    const executive = request.query.executive

    // Validate month and year
    if (!month || !year) {
      return reply.code(400).send({
        message: 'Month and Year are required parameters',
        error: 'Missing month or year'
      })
    }

    // Define the start and end dates based on the month and year
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 1)

    // Match condition based on role
    const matchCondition = {
      'activities.isCallTrue': true,
      'activities.createdAt': {
        $gte: startDate,
        $lt: endDate
      }
    }

    const userId =
      request.user.role === 'Sales Executive' ? request.user.userId : executive

    if (userId) {
      matchCondition['activities.user'] = new mongoose.Types.ObjectId(userId)
    }

    // Define the aggregation pipeline
    const pipeline = [
      { $unwind: '$activities' }, // Unwind activities array
      {
        $match: matchCondition
      },
      {
        $group: {
          _id: {
            year: { $year: '$activities.createdAt' },
            month: { $month: '$activities.createdAt' },
            day: { $dayOfMonth: '$activities.createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          date: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $toString: '$_id.month' },
              '-',
              { $toString: '$_id.day' }
            ]
          },
          count: 1
        }
      },
      { $sort: { date: 1 } }
    ]

    const data = await Leads.aggregate(pipeline)

    reply.code(200).send(data.length > 0 ? data : [])
  } catch (error) {
    console.error('Error fetching lead activity graph data:', error.message)
    reply.code(500).send({
      message: 'An error occurred while fetching lead activity graph data',
      error: error.message
    })
  }
}

// Lead Transfer API
export const transferLeads = async (request, reply) => {
  try {
    const { leadId = [], newAssignedUserId = null } = request.body
    const { userId } = request.user

    if (!leadId.length || !newAssignedUserId) {
      return reply.code(400).send({ message: 'Lead ID and user are required' })
    }

    if (!mongoose.Types.ObjectId.isValid(newAssignedUserId)) {
      return reply.code(400).send({ message: 'Invalid user ID' })
    }

    const leads = await Leads.find({ _id: { $in: leadId } }).exec()
    if (!leads.length) {
      return reply.code(400).send({ message: 'Leads not found' })
    }

    const newAssignedUser = await Users.findById(newAssignedUserId).exec()
    if (!newAssignedUser) {
      return reply.code(400).send({ message: 'User not found' })
    }

    leads.map((lead) => {
      if (lead.assignedTo?.toString() === newAssignedUserId) {
        return reply.code(400).send({
          message: `This lead is already assigned to ${lead.customerName}`
        })
      }
    })

    const bulkOperations = leads.map((lead) => {
      return {
        updateOne: {
          filter: { _id: lead._id },
          update: {
            $set: { assignedTo: newAssignedUserId },
            $push: {
              activities: {
                lead: lead._id,
                description: `Lead transferred to ${newAssignedUser.name}`,
                user: userId,
                isCallTrue: false
              },
              history: {
                action: 'TRANSFER',
                from: userId,
                to: newAssignedUserId,
                date: new Date()
              }
            }
          }
        }
      }
    })

    await Leads.bulkWrite(bulkOperations)

    reply.code(200).send({
      message: `Leads successfully transferred to ${newAssignedUser?.name || 'noother'}`
    })
  } catch (error) {
    console.error('Error transferring lead:', error)
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}

export const importLeads = async (request, reply) => {
  try {
    const file = await request.file()

    if (!file) {
      return reply.code(400).send({ message: 'Please upload a file' })
    }

    const uploadsDir = './uploads'

    // ✅ Auto create uploads folder
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    const filePath = `${uploadsDir}/${file.filename}`
    await pump(file.file, fs.createWriteStream(filePath))

    // Read Excel / CSV
    const workbook = XLSX.readFile(filePath)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet)

    let bulkData = []
    let unmatchedProducts = []

    const defaultUserId = new mongoose.Types.ObjectId(
      '677288451276f68713043b66'
    )

    for (const row of rows) {
      const rawProduct = row.contact_last_product
      let productIds = []

      if (rawProduct) {
        const productNames = rawProduct
          .split(/[,/|]+/)
          .map((p) => p.trim())
          .filter(Boolean)

        for (const name of productNames) {
          const cleanedName = name.replace(/[\W_]+/g, '').toLowerCase() // normalize input

          // ✅ Generate regex pattern (10ppm => 1\s*0\s*p\s*p\s*m)
          const regexPattern = cleanedName.split('').join('\\s*')

          // ✅ Flexible matching without schema change
          const product = await Items.findOne({
            name: { $regex: new RegExp(regexPattern, 'i') }
          }).select('_id')

          if (product) {
            productIds.push(product._id)
          } else {
            unmatchedProducts.push(name)
          }
        }
      }

      const existingLead = await Leads.findOne({
        mobileNumber: row.contacts_mobile1,
        ...buildDialCodeQuery(DEFAULT_DIAL_CODE)
      })

      if (existingLead) continue

      let lastDate

      if (typeof row.last_contact_date === 'number') {
        // Excel date number → convert to JS date
        const parsed = XLSX.SSF.parse_date_code(row.last_contact_date)
        lastDate = new Date(
          parsed.y,
          parsed.m - 1,
          parsed.d,
          parsed.H,
          parsed.M,
          parsed.S
        )
      } else if (typeof row.last_contact_date === 'string') {
        // Support multiple string formats
        const dateFormats = [
          'DD-MM-YYYY',
          'M/D/YYYY',
          'DD-MM-YYYY HH:mm',
          'M/D/YYYY HH:mm'
        ]
        lastDate = moment(row.last_contact_date, dateFormats, true).isValid()
          ? moment(row.last_contact_date, dateFormats, true).toDate()
          : new Date()
      } else {
        // fallback
        lastDate = new Date()
      }

      console.log('Parsed lastDate:', lastDate)

      bulkData.push({
        customerName: row.contacts_name || '',
        companyName: [row.contacts_company],
        mobileNumber: [row.contacts_mobile1],
        // The IndiaMART feed is India-only.
        country: DEFAULT_COUNTRY,
        phoneCountryCode: DEFAULT_DIAL_CODE,
        city: row.contact_city,
        state: row.contact_state,
        status: 'Old IM',
        products: productIds, // ✅ Array of product ids
        inquiries: 'IndiaMART',
        representative: 'TBD',
        quantity: 999,
        unit: 'KL',
        remark: 'Other',
        assignedTo: defaultUserId,
        comments:
          row.last_massage && row.Product_IM
            ? `${row.last_massage} || Product IM = ${row.Product_IM}`
            : row.last_massage
              ? row.last_massage
              : row.Product_IM
                ? `Product IM = ${row.Product_IM}`
                : '',
        createdAt: lastDate,
        updatedAt: lastDate
      })
    }

    await Leads.insertMany(bulkData, { ordered: false, timestamps: false })

    fs.unlinkSync(filePath)

    return reply.code(200).send({
      message: '✅ Leads Imported Successfully',
      inserted: bulkData.length,
      unmatchedProducts: [...new Set(unmatchedProducts)]
    })
  } catch (error) {
    console.error('❌ Error importing lead:', error)
    return reply.code(500).send({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}
