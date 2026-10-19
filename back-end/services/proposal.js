import mongoose from 'mongoose'
import Proposals from '../models/Proposals.js'
import Joi from 'joi'
import fs from 'fs'
import path from 'path'
import pump from 'pump'
import { fileURLToPath } from 'url'
import { Console, log } from 'console'

// Define Joi schema for validation
const proposalValidationSchema = Joi.object({
  proposalTo: Joi.string().required().min(2).max(50).messages({
    'string.empty': 'Proposal_To cannot be empty',
    'any.required': 'Proposal_To is required',
    'string.pattern.base': 'Proposal_To must have at least 2 words',
    'string.max': 'Proposal_To must be at most 50 characters'
  }),
  subject: Joi.string().required().min(2).max(50).messages({
    'string.empty': 'Subject cannot be empty',
    'any.required': 'Subject is required',
    'string.pattern.base': 'Subject must have at least 2 words',
    'string.max': 'Subject must be at most 50 characters'
  }),
  relatedTo: Joi.string().required().messages({
    'any.required': 'Related client or lead is required'
  }),
  date: Joi.date().required().messages({
    'date.base': 'Invalid date format',
    'any.required': 'Date is required'
  }),
  mobileNumber: Joi.string()
    .regex(/^[0-9]{10}$/)
    .required()
    .messages({
      'string.pattern.base': 'Mobile number must be exactly 10 digits',
      'any.required': 'Mobile number is required'
    }),
  state: Joi.string().required().messages({
    'any.required': 'State is required'
  }),
  city: Joi.string().required().messages({
    'any.required': 'City is required'
  }),
  uploadedFile: Joi.object({
    filename: Joi.string().required(),
    contentType: Joi.string().required(),
    data: Joi.binary().required()
  }).optional()
})

// POST API
export const addProposal = async (request, reply) => {
  try {
    // Parse multipart form-data
    const parts = await request.parts()

    let formData = {}
    let fileBuffer = null
    let fileDetails = null

    // Extract file and form fields
    for await (const part of parts) {
      if (part.file) {
        // This is the uploaded file
        const chunks = []
        for await (const chunk of part.file) {
          chunks.push(chunk)
        }
        fileBuffer = Buffer.concat(chunks)

        // Save file details
        fileDetails = {
          filename: part.filename,
          contentType: part.mimetype
        }
      } else if (part.fieldname) {
        // This is a regular form field
        formData[part.fieldname] = part.value
      }
    }

    // Check for file upload
    if (!fileBuffer) {
      return reply.code(400).send({ error: 'No file uploaded' })
    }

    // Check file size (10MB limit)
    const maxSize = 15 * 1024 * 1024 // 15MB
    if (fileBuffer.length > maxSize) {
      return reply.code(400).send({
        message: 'File size exceeds 15MB limit',
        error: error.message
      })
    }

    // Joi validation for the form fields
    const { error } = proposalValidationSchema.validate(formData, {
      abortEarly: false
    })

    if (error) {
      const validationErrors = error.details.map((err) => err.message)
      return reply.code(400).send({ error: validationErrors })
    }

    // Destructure form fields from parsed data
    const { proposalTo, subject, relatedTo, date, mobileNumber, state, city } =
      formData

    // Validate form fields
    if (
      !proposalTo ||
      !subject ||
      !relatedTo ||
      !date ||
      !mobileNumber ||
      !state ||
      !city
    ) {
      return reply.code(400).send({ error: 'Missing required form fields' })
    }

    // Create new proposal
    const newProposal = new Proposals({
      proposalTo,
      subject,
      relatedTo,
      date,
      uploadedFile: {
        filename: fileDetails.filename,
        contentType: fileDetails.contentType,
        data: fileBuffer
      },
      mobileNumber,
      state,
      city
    })

    // Save proposal to the database
    await newProposal.save()

    reply.code(201).send({
      message: 'Proposal created successfully',
      proposalId: newProposal._id
    })
  } catch (error) {
    console.error('Error:', error)
    reply.code(500).send({ error: 'Internal Server Error' })
  }
}
// GET API
export const getAllProposals = async (request, reply) => {
  try {
    const { page = 1, limit = 10, state, city, proposalTo } = request.query
    // Build filter query based on state and city
    const filter = {}
    if (state) {
      filter.state = state
    }
    if (city) {
      filter.city = city
    }
    if (proposalTo) {
      const searchRegex = new RegExp(proposalTo, 'i')
      filter.proposalTo = searchRegex
    }

    // Fetch filtered proposals with pagination
    const proposals = await Proposals.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))

    // Modify the response to include file information without downloading
    const responseData = proposals.map((proposal) => ({
      _id: proposal._id,
      proposalTo: proposal.proposalTo,
      subject: proposal.subject,
      relatedTo: proposal.relatedTo,
      date: proposal.date,
      mobileNumber: proposal.mobileNumber,
      state: proposal.state,
      city: proposal.city
    }))

    // Count the total number of proposals matching the filters
    const totalProposals = await Proposals.countDocuments(filter)

    // Send the paginated response
    reply.code(200).send({
      proposals: responseData,
      totalPages: Math.ceil(totalProposals / limit),
      currentPage: Number(page),
      totalProposals
    })
  } catch (error) {
    console.error('Error fetching proposals:', error)
    reply.code(500).send({ error: 'Internal Server Error' })
  }
}
// GET Proposal by ID
export const getProposalById = async (request, reply) => {
  try {
    const { proposalId } = request.params
    const proposal = await Proposals.findById(proposalId)

    if (!proposal) {
      return reply.code(404).send({ error: 'Proposal not found' })
    }

    // Modify the response to include file information without downloading
    const responseData = {
      _id: proposal._id,
      proposalTo: proposal.proposalTo,
      subject: proposal.subject,
      relatedTo: proposal.relatedTo,
      date: proposal.date,
      mobileNumber: proposal.mobileNumber,
      state: proposal.state,
      city: proposal.city,
      uploadedFile: {
        filename: proposal.uploadedFile.filename,
        contentType: proposal.uploadedFile.contentType,
        data: proposal.uploadedFile.data.toString('base64')
      }
    }

    reply.code(200).send(responseData)
  } catch (error) {
    console.error('Error fetching proposal:', error)
    reply.code(500).send({ error: 'Internal Server Error' })
  }
}

// delete api
export const deleteProposal = async (request, reply) => {
  try {
    const { proposalId } = request.params

    const deleteProposal = await Proposals.findByIdAndDelete(proposalId)

    if (!deleteProposal) {
      return reply.code(404).send({ message: 'Proposal not found' })
    }
    reply
      .code(200)
      .send({ message: 'Proposal Deleted Successfully', deleteProposal })
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal server error', error: error.message })
  }
}

// PUT API
export const updateProposal = async (request, reply) => {
  try {
    const { proposalId } = request.params
    const parts = await request.parts()

    let formData = {}
    let fileBuffer = null
    let fileDetails = null

    // Extract file and form fields
    for await (const part of parts) {
      if (part.file) {
        // This is the uploaded file
        const chunks = []
        for await (const chunk of part.file) {
          chunks.push(chunk)
        }
        fileBuffer = Buffer.concat(chunks)

        // Save file details
        fileDetails = {
          filename: part.filename,
          contentType: part.mimetype
        }
      } else if (part.fieldname) {
        // This is a regular form field
        formData[part.fieldname] = part.value
      }
    }

    // Joi validation for the form fields
    const { error } = proposalValidationSchema.validate(formData, {
      abortEarly: false
    })
    if (error) {
      const validationErrors = error.details.map((err) => err.message)
      return reply.code(400).send({ error: validationErrors })
    }

    // Destructure form fields
    const { proposalTo, subject, relatedTo, date, mobileNumber, state, city } =
      formData

    // Validate required fields
    if (
      !proposalTo ||
      !subject ||
      !relatedTo ||
      !date ||
      !mobileNumber ||
      !state ||
      !city
    ) {
      return reply.code(400).send({ error: 'Missing required form fields' })
    }

    // Find the proposal by ID
    const proposal = await Proposals.findById(proposalId)
    if (!proposal) {
      return reply.code(404).send({ error: 'Proposal not found' })
    }

    // Update proposal details
    proposal.proposalTo = proposalTo
    proposal.subject = subject
    proposal.relatedTo = relatedTo
    proposal.date = date
    proposal.mobileNumber = mobileNumber
    proposal.state = state
    proposal.city = city

    // If a new file is uploaded, update file details
    if (fileBuffer) {
      // Check file size (10MB limit)
      const maxSize = 15 * 1024 * 1024 // 15MB
      if (fileBuffer.length > maxSize) {
        return reply.code(400).send({
          message: 'File size exceeds 15MB limit',
          error: error.message
        })
      }

      proposal.uploadedFile = {
        filename: fileDetails.filename,
        contentType: fileDetails.contentType,
        data: fileBuffer
      }
    }

    // Save updated proposal
    await proposal.save()

    // Respond with success
    reply.code(200).send({
      message: 'Proposal updated successfully',
      proposalId: proposal._id
    })
  } catch (error) {
    console.error('Error updating proposal:', error)
    reply.code(500).send({ error: 'Internal Server Error' })
  }
}
