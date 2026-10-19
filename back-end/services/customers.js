import { Leads, Sales, Users } from '../models/index.js'
import mongoose from 'mongoose'
import Joi from 'joi'
import SalesTarget from '../models/salesTarget.js'
import { objectIdValidator } from './leads.js'
import Customers from '../models/Customers.js'
import moment from 'moment-timezone'

const addressSchema = Joi.object({
  companyName: Joi.string().allow('', null).optional().messages({
    'string.base': 'Company name must be a string'
  }),
  address: Joi.string().required().messages({
    'string.base': 'Address must be a string',
    'string.empty': 'Address cannot be empty',
    'any.required': 'Address is required'
  }),
  state: Joi.string().required().messages({
    'string.base': 'State must be a string',
    'string.empty': 'State cannot be empty',
    'any.required': 'State is required'
  }),
  city: Joi.string().required().messages({
    'string.base': 'City must be a string',
    'string.empty': 'City cannot be empty',
    'any.required': 'City is required'
  }),
  zipCode: Joi.string()
    .pattern(/^\d{6}$/, 'ZipCode must be a 6-digit number')
    .required()
    .messages({
      'string.base': 'ZipCode must be a string',
      'string.empty': 'ZipCode cannot be empty',
      'string.pattern.base': 'ZipCode must be a 6-digit number',
      'any.required': 'ZipCode is required'
    })
})
const salesSchema = Joi.object({
  customerName: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Customer name must be at least 3 characters long.',
    'string.max':
      'Customer name must be less than or equal to 100 characters long.',
    'any.required': 'Customer name is required.',
    'string.empty': 'Customer name is required.'
  }),
  tankerNo: Joi.string().required().messages({
    'any.required': 'Tanker number is required.',
    'string.empty': 'Tanker number is required.'
  }),
  invoiceNo: Joi.string().required().messages({
    'any.required': 'Invoice number is required.',
    'string.empty': 'Invoice number is required.'
  }),
  companyName: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Company name must be at least 3 characters long.',
    'string.max':
      'Company name must be less than or equal to 100 characters long.',
    'any.required': 'Company name is required.',
    'string.empty': 'Company name is required.'
  }),
  product: Joi.string().custom(objectIdValidator).required().messages({
    'any.required': 'Product is required.',
    'string.empty': 'Product is required.'
  }),

  quantity: Joi.number().min(1).required().messages({
    'number.min': 'Quantity must be at least 1.',
    'any.required': 'Quantity is required.',
    'string.empty': 'Quantity is required.'
  }),
  unit: Joi.string().valid('KL', 'MTS').required().messages({
    'any.required': 'unit is required.',
    'string.empty': 'unit cannot be empty.',
    'any.only': 'unit must be one of KG, KL.'
  }),
  date: Joi.date().required().messages({
    'any.required': 'Date is required.',
    'date.base': 'Date must be a valid date.'
  }),
  day: Joi.number().required().messages({
    'any.required': 'Day is required.',
    'string.empty': 'Day cannot be empty.'
  }),
  month: Joi.number().required().messages({
    'any.required': 'Month is required.',
    'string.empty': 'Month cannot be empty.'
  }),
  year: Joi.number().required().messages({
    'any.required': 'Year is required.',
    'string.empty': 'Year cannot be empty.'
  }),
  density: Joi.number().required().messages({
    'any.required': 'Density is required.',
    'number.base': 'Density must be a number.'
  }),
  fullRate: Joi.number().required().messages({
    'any.required': 'Full Rate is required.',
    'number.base': 'Full Rate must be a number.'
  }),
  leadId: Joi.string().allow('').optional().messages({
    'string.empty': 'Product is required.'
  }),
  billingAddress: addressSchema.required().messages({
    'object.base': 'Billing address must be an object',
    'any.required': 'Billing address is required'
  }),
  shippingAddress: addressSchema.required().messages({
    'object.base': 'Shipping address must be an object',
    'any.required': 'Shipping address is required'
  }),

  gstBillName: Joi.string().allow(null, '').optional(),
  gstBillPdf: Joi.binary().allow(null, '').optional(),
  convertToKL: Joi.number().optional().min(0).allow(null),
  user: Joi.object().pattern(Joi.any(), Joi.any()).optional().allow(null)
})

// Function to validate sale data
const validateSale = (data) => salesSchema.validate(data, { abortEarly: false })

export const newCustomer = async (request, reply) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const { error } = validateSale(request.body)
    const { leadId } = request.query
    if (error) {
      const errorMessages = error.details.map((err) => err.message)
      return reply
        .code(400)
        .send({ message: 'Validation Error', errors: errorMessages })
    }

    if (request.body.gstBillPdf) {
      try {
        let fileSize
        if (Buffer.isBuffer(request.body.gstBillPdf)) {
          fileSize = request.body.gstBillPdf.length
        } else if (typeof request.body.gstBillPdf === 'string') {
          fileSize = Buffer.byteLength(request.body.gstBillPdf)
        } else if (request.body.gstBillPdf instanceof Object) {
          // If it's coming as multipart form data
          fileSize = request.body.gstBillPdf.size
        } else {
          throw new Error('Invalid file format')
        }
      } catch (error) {
        console.error('File size check error:', error)
        return reply.code(400).send({
          success: false,
          message: 'Invalid file format'
        })
      }
    }

    let saleOrderId = null

    if (leadId) {
      const salesOrder = new Sales({
        customerName: request.body.customerName,
        tankerNo: request.body.tankerNo,
        invoiceNo: request.body.invoiceNo,
        companyName: request.body.companyName,
        product: request.body.product,
        quantity: request.body.quantity,
        unit: request.body.unit,
        date: request.body.date,
        density: request.body.density,
        fullRate: request.body.fullRate,
        leadId: leadId ? new mongoose.Types.ObjectId(leadId) : null,
        gstBillName: request.body.gstBillName || '',
        gstBillPdf: request.body.gstBillPdf || '',
        month: request.body.month,
        year: request.body.year,
        day: request.body.day,
        billingAddress: request.body.billingAddress,
        shippingAddress: request.body.shippingAddress,
        addedBy: request.user.role,
        user: request.body.user?.id || request.user.userId
      })

      await salesOrder.save({ session })

      saleOrderId = salesOrder._id
      // Sale order add in activity
      const userName = await Users.findById(request.user.userId)
        .select('name')
        .session(session)
      const lead = await Leads.findById(leadId).session(session)
      let activity = {
        lead: lead._id,
        description: `${userName?.name} sold a ${request.body.quantity} ${request.body.unit} quantity.`,
        user: request.user.userId
      }

      lead.activities.push(activity)
      await lead.save({ session })
    }

    const existingCustomer = await Customers.findOne({
      leadId: new mongoose.Types.ObjectId(leadId)
    }).session(session)

    if (existingCustomer) {
      if (saleOrderId) {
        existingCustomer.salesOrders.push(saleOrderId)
        await existingCustomer.save({ session })
      }

      if (saleOrderId) {
        await Sales.findByIdAndUpdate(
          saleOrderId,
          { $set: { customer: existingCustomer._id } },
          { new: true, session }
        )
      }
    } else {
      const customer = new Customers({
        ...request.body,
        date: request.body.date,
        leadId: leadId ? new mongoose.Types.ObjectId(leadId) : null,
        addedBy: request.user.role,
        user: request.user.userId,
        salesOrders: saleOrderId ? [saleOrderId] : []
      })
      await customer.save({ session })

      if (saleOrderId) {
        await Sales.findByIdAndUpdate(
          saleOrderId,
          { $set: { customer: customer._id } },
          { new: true, session }
        )
      }
    }

    if (request.body?.month && request.body?.year) {
      const { quantity, unit, month, year, convertToKL = null } = request.body
      const targetUser = request.body.user?.id || request.user.userId
      const salesTarget = await SalesTarget.findOne({
        salesExecutiveId: targetUser,
        month,
        year
      }).session(session)

      if (salesTarget) {
        await SalesTarget.findOneAndUpdate(
          { salesExecutiveId: targetUser, month, year },
          {
            $inc: { saleQuantity: unit === 'KL' ? quantity : convertToKL }
          },
          {
            new: true,
            runValidators: true,
            session
          }
        )
      } else {
        await SalesTarget.create(
          [
            {
              salesExecutiveId: targetUser,
              month,
              year,
              unit: 'KL',
              saleQuantity: unit === 'KL' ? quantity : convertToKL,
              targetQuantity: 100,
              createdBy: request.user.userId
            }
          ],
          { session }
        )
      }
    }

    await session.commitTransaction()
    reply.code(201).send({
      success: true,
      customer: existingCustomer
    })
  } catch (error) {
    await session.abortTransaction()
    console.log('Error while order adding 266:>', error)
    reply.code(500).send({
      success: false,
      message: 'Internal Server Error',
      errors: error.message
    })
  } finally {
    session.endSession()
  }
}

const validateProductId = (productId) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error('Product ID is Invalid format.')
  }
}

const calculateKLQuantity = (quantity, unit, density) => {
  return unit === 'KL'
    ? parseFloat(quantity)
    : parseFloat((quantity / (density * 0.001)).toFixed(2))
}

export const updateCustomerById = async (request, reply) => {
  const session = await mongoose.startSession()
  session.startTransaction()
  try {
    const { orderId } = request.params
    const {
      product,
      month,
      year,
      quantity: newQuantity,
      unit: newUnit,
      convertToKL,
      user
    } = request.body
    // Validate inputs
    validateProductId(product)
    const { error } = validateSale(request.body)
    if (error) {
      return reply.code(400).send({
        message: 'Validation Error',
        errors: error.details.map((err) => err.message)
      })
    }
    // Prepare update payload, excluding user from spread
    const { user: userObj, ...restPayload } = request.body
    const updatePayload = { ...restPayload }
    // Handle user field
    if (
      userObj &&
      typeof userObj === 'object' &&
      userObj.id &&
      mongoose.isValidObjectId(userObj.id)
    ) {
      updatePayload.user = userObj.id // Set user to valid ObjectId
    } else if (userObj) {
      await session.abortTransaction()
      return reply.code(400).send({
        message: 'Invalid user data',
        errors: ['User ID must be a valid ObjectId']
      })
    }
    // Get sale
    const sale = await Sales.findById(orderId).session(session)
    if (!sale) {
      await session.abortTransaction()
      return reply.code(404).send({
        message: 'Sale data not found.'
      })
    }
    // Validate new user existence if user is being changed
    let isUserChanged = false
    if (userObj && userObj.id && sale.user.toString() !== userObj.id) {
      const newUser = await Users.findById(userObj.id).session(session)
      if (!newUser) {
        await session.abortTransaction()
        return reply.code(400).send({
          message: 'Invalid user',
          errors: ['New user ID does not exist']
        })
      }
      isUserChanged = true
    }
    // Check if month has changed
    const isMonthChanged = sale.month !== month
    // Calculate quantities
    const oldQuantityInKL = calculateKLQuantity(
      sale.quantity,
      sale.unit,
      sale.density
    )
    const newQuantityInKL = parseFloat(
      newUnit === 'KL' ? newQuantity : convertToKL
    )
    const quantityDifference = parseFloat(
      (newQuantityInKL - oldQuantityInKL).toFixed(2)
    )
    // Parallel database operations
    const [updatedSale, userName, lead] = await Promise.all([
      Sales.findByIdAndUpdate(orderId, updatePayload, {
        new: true,
        runValidators: true,
        session
      }),
      Users.findById(request.user.userId).select('name').session(session),
      Leads.findById(sale.leadId).session(session)
    ])
    // Prepare sales target updates
    const salesTargetUpdates = []
    // If user is not changed but quantity changed, update original user's sales target
    if (!isUserChanged && quantityDifference !== 0 && !isMonthChanged) {
      const currentTarget = await SalesTarget.findOne({
        salesExecutiveId: sale.user,
        month,
        year
      }).session(session)
      const newSaleQuantity = currentTarget
        ? (currentTarget.saleQuantity || 0) + quantityDifference
        : quantityDifference
      if (newSaleQuantity < 0) {
        await session.abortTransaction()
        return reply.code(400).send({
          message: 'Sale quantity cannot be negative for original user'
        })
      }
      salesTargetUpdates.push(
        SalesTarget.findOneAndUpdate(
          { salesExecutiveId: sale.user, month, year },
          {
            $set: {
              saleQuantity: parseFloat(newSaleQuantity.toFixed(2))
            }
          },
          { new: true, session, upsert: false }
        )
      )
    }
    // If user is changed, adjust sales targets for old and new users
    if (isUserChanged) {
      // Deduct from old user's sales target
      const oldTarget = await SalesTarget.findOne({
        salesExecutiveId: sale.user,
        month: sale.month,
        year
      }).session(session)
      let newOldSaleQuantity = null // Default if no oldTarget
      if (oldTarget) {
        newOldSaleQuantity = (oldTarget.saleQuantity || 0) - oldQuantityInKL
        if (newOldSaleQuantity < 0) {
          await session.abortTransaction()
          return reply.code(400).send({
            message: 'Sale quantity cannot be negative for old user'
          })
        }
        salesTargetUpdates.push(
          SalesTarget.findOneAndUpdate(
            { salesExecutiveId: sale.user, month: sale.month, year },
            {
              $set: {
                saleQuantity: parseFloat(newOldSaleQuantity.toFixed(2))
              }
            },
            { new: true, session, upsert: false }
          )
        )
      }
      // Add to new user's sales target
      const newTarget = await SalesTarget.findOne({
        salesExecutiveId: userObj.id,
        month,
        year
      }).session(session)
      const newSaleQuantity = newTarget
        ? (newTarget.saleQuantity || 0) + newQuantityInKL
        : newQuantityInKL
      salesTargetUpdates.push(
        SalesTarget.findOneAndUpdate(
          { salesExecutiveId: userObj.id, month, year },
          {
            $set: {
              saleQuantity: parseFloat(newSaleQuantity.toFixed(2))
            },
            ...(newTarget
              ? {}
              : {
                  $setOnInsert: {
                    targetQuantity: 0, // Only set for new documents
                    unit: 'KL',
                    createdBy: request.user.userId
                  }
                })
          },
          { new: true, session, upsert: true, setDefaultsOnInsert: true }
        )
      )
    }
    // Handle month change
    if (isMonthChanged && !isUserChanged) {
      // Deduct from old month's sales target
      const oldTarget = await SalesTarget.findOne({
        salesExecutiveId: sale.user,
        month: sale.month,
        year
      }).session(session)
      let newOldSaleQuantity = null
      if (oldTarget) {
        newOldSaleQuantity = (oldTarget.saleQuantity || 0) - oldQuantityInKL
        if (newOldSaleQuantity < 0) {
          await session.abortTransaction()
          return reply.code(400).send({
            message: 'Sale quantity cannot be negative for old month'
          })
        }
        salesTargetUpdates.push(
          SalesTarget.findOneAndUpdate(
            { salesExecutiveId: sale.user, month: sale.month, year },
            {
              $set: {
                saleQuantity: parseFloat(newOldSaleQuantity.toFixed(2))
              }
            },
            { new: true, session, upsert: false }
          )
        )
      }
      // Add to new month's sales target
      const newTarget = await SalesTarget.findOne({
        salesExecutiveId: sale.user,
        month,
        year
      }).session(session)
      const newSaleQuantity = newTarget
        ? (newTarget.saleQuantity || 0) + newQuantityInKL
        : newQuantityInKL
      salesTargetUpdates.push(
        SalesTarget.findOneAndUpdate(
          { salesExecutiveId: sale.user, month, year },
          {
            $set: {
              saleQuantity: parseFloat(newSaleQuantity.toFixed(2)),
              unit: 'KL',
              createdBy: request.user.userId
            },
            ...(newTarget
              ? {}
              : {
                  $setOnInsert: {
                    targetQuantity: 0 // Only set for new documents
                  }
                })
          },
          { new: true, session, upsert: true, setDefaultsOnInsert: true }
        )
      )
    }
    // Update activity and sales target
    await Promise.all([
      Leads.findByIdAndUpdate(
        lead._id,
        {
          $push: {
            activities: {
              lead: lead._id,
              description: `Sale order updated by ${userName.name}${
                isUserChanged ? `, assigned to new user: ${userObj.id}` : ''
              }${isMonthChanged ? `, month changed to ${month}` : ''}`,
              user: request.user.userId
            }
          }
        },
        { session }
      ),
      ...salesTargetUpdates
    ])
    await session.commitTransaction()
    return reply.code(200).send(updatedSale)
  } catch (error) {
    await session.abortTransaction()
    console.error('Sales update:', {
      orderId: request.params.orderId || 'unknown',
      error: error.message,
      stack: error.stack
    })
    return reply.code(error.status || 500).send({
      message: 'Failed to update sale data.',
      errors: error.message
    })
  } finally {
    session.endSession()
  }
}

export const getCustomers = async (request, reply) => {
  try {
    const {
      page = 1,
      rowsPerPage = 10,
      customerName,
      date,
      companyName,
      product,
      addedBy,
      assignedTo
    } = request.query

    const skip = (page - 1) * rowsPerPage

    // create a filter
    const filter = {}

    // A Sales Executive sees their own book: customers they created, plus any
    // whose lead is assigned to them (e.g. a lead transferred to them, or one
    // an Admin converted on their behalf).
    if (request.user.role === 'Sales Executive') {
      const myLeadIds = await Leads.find({
        assignedTo: request.user.userId
      }).distinct('_id')

      filter.$or = [
        { user: new mongoose.Types.ObjectId(request.user.userId) },
        { leadId: { $in: myLeadIds } }
      ]
    }

    if (customerName) {
      filter.leadId = customerName
    }
    if (date) {
      const startOfDayIST = moment
        .utc(date)
        .add(5, 'hours')
        .add(30, 'minutes')
        .startOf('day')
        .toDate()
      const endOfDayIST = moment
        .utc(date)
        .add(5, 'hours')
        .add(30, 'minutes')
        .endOf('day')
        .toDate()

      filter.createdAt = {
        $gte: startOfDayIST,
        $lt: endOfDayIST
      }
    }
    if (companyName) {
      filter.companyName = { $regex: companyName, $options: 'i' }
    }
    if (product) {
      filter.product = product
    }
    if (addedBy) {
      filter.addedBy = { $regex: addedBy, $options: 'i' }
    }
    // The assignee lives on the lead, so resolve it to the matching lead ids
    // and intersect with any customerName (lead) filter already applied.
    if (assignedTo) {
      if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
        return reply.code(400).send({ message: 'Invalid assignedTo format' })
      }
      const leadIds = await Leads.find({ assignedTo }).distinct('_id')
      filter.leadId = customerName
        ? { $in: leadIds.filter((id) => String(id) === String(customerName)) }
        : { $in: leadIds }
    }

    const customers = await Customers.find(filter)
      .populate({ path: 'user', select: 'name' })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(rowsPerPage)
      .select('customerName date addedBy leadId createdAt')
      .populate({
        path: 'leadId',
        select: 'customerName companyName assignedTo',
        populate: { path: 'assignedTo', select: 'name' }
      })

    const totalCustomers = await Customers.countDocuments(filter)
    const totalPages = Math.ceil(totalCustomers / rowsPerPage)

    reply.send({ customers, totalCustomers, totalPages })
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Failed to fetch sales data.', error: error.message })
  }
}

export const getCustomerById = async (request, reply) => {
  const { customerId } = request.params

  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    return reply.code(400).send({ message: 'Invalid customerId format' })
  }

  try {
    const customer = await Customers.findById(customerId)
      .populate({
        path: 'salesOrders',
        select:
          'tankerNo invoiceNo companyName product quantity unit date density fullRate billingAddress shippingAddress gstBillName gstBillPdf user addedBy',
        options: { sort: { date: 1 } },

        populate: {
          path: 'product',
          select: 'name'
        },
        populate: {
          path: 'user',
          select: 'name'
        }
      })
      .populate({ path: 'user', select: 'name' })
      .populate({ path: 'leadId', select: 'customerName' })

    if (!customer) {
      return reply.code(404).send({ message: 'Customer data not found' })
    }

    reply
      .code(200)
      .send({ message: 'Customer data fetched successfully', customer })
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', errors: error.message })
  }
}

export const getSalesByUser = async (request, reply) => {
  const { userId } = request.params
  const { month, year, page = 1, limit = 10 } = request.query

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return reply.code(400).send({ message: 'Invalid userId format' })
  }

  const filter = {
    user: userId
  }

  if (month) filter.month = parseInt(month)
  if (year) filter.year = parseInt(year)

  const skip = (parseInt(page) - 1) * parseInt(limit)

  try {
    // Fetch paginated sales
    const sales = await Sales.find(filter)
      .sort({ date: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({ path: 'product', select: 'name' })
      .populate({ path: 'user', select: 'name' })

    // Total count for pagination
    const totalCount = await Sales.countDocuments(filter)

    // Total sale quantity in KL
    const totalSaleQuantity = sales.reduce((sum, sale) => {
      const quantityInKL =
        sale.unit === 'KL'
          ? sale.quantity
          : sale.quantity / (sale.density * 0.001)
      return sum + (quantityInKL || 0)
    }, 0)

    // Fetch sales target
    let salesTargetData = null
    if (month && year) {
      salesTargetData = await SalesTarget.findOne({
        salesExecutiveId: userId,
        month: parseInt(month),
        year: parseInt(year)
      })
    }

    reply.code(200).send({
      message: 'Sales data fetched successfully',
      data: {
        sales,
        totalSaleQuantity: parseFloat(totalSaleQuantity.toFixed(2)), // *** MODIFIED: Ensure totalSaleQuantity is rounded to 2 decimal places ***
        targetQuantity: salesTargetData?.targetQuantity || 0,
        totalCount,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    })
  } catch (error) {
    reply.code(500).send({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

export const deleteSaleById = async (request, reply) => {
  const { customerId } = request.params
  const { salesOrderId } = request.query

  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    return reply.code(400).send({ message: 'Invalid customer ID format.' })
  }
  if (!mongoose.Types.ObjectId.isValid(salesOrderId)) {
    return reply.code(400).send({ message: 'Invalid sales order ID format.' })
  }

  try {
    const customer = await Customers.findById(customerId)

    if (!customer) {
      return reply.code(404).send({ message: 'Customer data not found.' })
    }

    const salesOrderObjId = new mongoose.Types.ObjectId(salesOrderId)
    if (!customer.salesOrders.includes(salesOrderObjId)) {
      return reply
        .code(404)
        .send({ message: 'Sales order ID not found in the sale.' })
    }

    const updatedCustomer = await Customers.findByIdAndUpdate(
      customerId,
      { $pull: { salesOrders: salesOrderObjId } },
      { new: true }
    )

    if (!updatedCustomer) {
      return reply.code(404).send({
        success: false,
        message: 'Sale order not found'
      })
    }

    const sale = await Sales.findById(salesOrderObjId)

    if (sale) {
      const saleQuantity = sale.quantity
      const { month, year } = sale

      const result = await Sales.findByIdAndDelete(salesOrderObjId)
      const salesTarget = await SalesTarget.findOne({
        salesExecutiveId: sale.user,
        month,
        year
      })

      const qunatityDelete =
        result.unit === 'KL'
          ? result.quantity
          : (result.quantity / (result.density * 0.001)).toFixed(2)

      const userName = await Users.findById(request.user.userId).select('name')
      const lead = await Leads.findById(sale.leadId)
      let activity = {
        lead: lead._id,
        description: `Sale order deleted by ${userName.name}`,
        user: request.user.userId
      }

      lead.activities.push(activity)
      await lead.save()

      if (salesTarget) {
        // Subtract the sale's quantity from the saleQuantity in salesTarget
        const response = await SalesTarget.findOne({
          salesExecutiveId: sale.user,
          month,
          year
        })

        if (response.saleQuantity - qunatityDelete < 0) {
          return reply.code(400).send({
            success: false,
            message: 'Sale quantity cannot be less than 0.'
          })
        }

        await SalesTarget.findOneAndUpdate(
          { salesExecutiveId: sale.user, month, year },
          { $set: { saleQuantity: salesTarget.saleQuantity - qunatityDelete } },
          {
            new: true,
            runValidators: true
          }
        )
      }
    }

    reply
      .code(200)
      .send({ message: 'Sales Order ID successfully removed from Sale Data.' })
  } catch (error) {
    reply.code(500).send({
      message: 'Failed to delete Sales Order ID from Sale Data.',
      errors: error.message
    })
  }
}

const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
]

export const getChartData = async (request, reply) => {
  try {
    const {
      year = null,
      month = null,
      state = null,
      city = null,
      product = null,
      executive = null,
      quantity = null,
      customerName = null,
      chartType = null
    } = request.query

    const filter = buildFilter({
      year,
      month,
      state,
      city,
      product,
      executive,
      quantity,
      customerName
    })

    let result
    switch (chartType) {
      case 'live-analytics':
        result = await getLiveAnalyticsData(filter, year, month)
        break
      case 'quantity-records':
        result = await getQuantityRecordsData(filter, year, month)
        break
      case 'sales-records':
        result = await getSalesRecordsData(filter, year, month)
        break
      default:
        throw new Error('Invalid chart type')
    }

    reply.send(result)
  } catch (error) {
    reply.code(500).send({
      message: 'Failed to fetch records data.',
      error: error.message
    })
  }
}

const buildFilter = ({
  year,
  month,
  state,
  city,
  product,
  executive,
  quantity,
  customerName
}) => {
  const filter = {}
  if (year) filter.year = Number(year) || null
  if (month) filter.month = Number(month) || null
  if (state) filter.state = state
  if (city) filter.city = city
  if (quantity) filter.unit = quantity
  if (executive)
    filter.user = executive ? new mongoose.Types.ObjectId(executive) : null
  if (customerName) {
    filter.customerName = customerName
  }

  if (product) {
    const productIds = product
      .split(',')
      .map((id) => new mongoose.Types.ObjectId(id.trim()))
    if (productIds.length > 0) {
      filter.product = { $in: productIds }
    }
  }

  return filter
}

const getRecordsData = async (
  filter,
  year,
  month,
  aggregationField,
  groupField
) => {
  if (month) {
    return getMonthlyRecordsData(
      filter,
      year,
      month,
      aggregationField,
      groupField
    )
  }
  return getYearlyRecordsData(filter, year, aggregationField, groupField)
}

const getMonthlyRecordsData = async (
  filter,
  year,
  month,
  aggregationField,
  groupField
) => {
  const daysInMonth = new Date(Number(year), Number(month), 0).getDate()

  const unit = filter.unit
  delete filter.unit

  let recordsData

  if (aggregationField === 'quantity') {
    // Handle conversion for quantity
    recordsData = await Sales.aggregate([
      { $match: filter },
      {
        $project: {
          quantity: {
            $cond: {
              if: { $eq: [unit, 'KL'] }, // Check if the selected unit is KL
              then: {
                $add: [
                  {
                    $cond: {
                      if: { $eq: ['$unit', 'MTS'] }, // If record unit is MTS
                      then: {
                        $multiply: [
                          { $divide: ['$quantity', '$density'] },
                          1000
                        ]
                      }, // Convert MTS to KL
                      else: '$quantity' // Keep KL as is
                    }
                  }
                ]
              },
              else: {
                $add: [
                  {
                    $cond: {
                      if: { $eq: ['$unit', 'MTS'] }, // If record unit is MTS
                      then: '$quantity', // Keep MTS as is
                      else: 0
                    }
                  },
                  {
                    $cond: {
                      if: { $eq: ['$unit', 'KL'] }, // If record unit is KL
                      then: {
                        $divide: [
                          { $multiply: ['$quantity', '$density'] },
                          1000
                        ]
                      }, // Convert KL to MTS
                      else: 0
                    }
                  }
                ]
              }
            }
          },
          density: 1,
          unit: 1,
          day: { $dayOfMonth: { $add: ['$date', 5.5 * 60 * 60 * 1000] } },
          month: { $month: { $add: ['$date', 5.5 * 60 * 60 * 1000] } },
          year: { $year: { $add: ['$date', 5.5 * 60 * 60 * 1000] } }
        }
      },
      {
        $group: {
          _id: {
            year: '$year',
            month: '$month',
            day: '$day'
          },
          totalQuantity: { $sum: '$quantity' } // Sum the adjusted quantities
        }
      },
      { $sort: { '_id.day': 1 } }
    ])
  } else {
    recordsData = await Sales.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: { $add: ['$date', 5.5 * 60 * 60 * 1000] } },
            month: { $month: { $add: ['$date', 5.5 * 60 * 60 * 1000] } },
            day: { $dayOfMonth: { $add: ['$date', 5.5 * 60 * 60 * 1000] } }
          },
          [groupField]: { $sum: `$${aggregationField}` }
        }
      },
      { $sort: { '_id.day': 1 } }
    ])
  }

  // Create an array of data for each day of the month
  const data = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1
    const dayData =
      recordsData.find(
        (data) =>
          data._id.day === day &&
          data._id.month === Number(month) &&
          data._id.year === Number(year)
      ) || {}

    return {
      date: day,
      [groupField]: dayData[groupField] || 0
    }
  })

  // Calculate the total value for the month
  const totalMonthValue = data.reduce((sum, day) => sum + day[groupField], 0)

  return { totalMonthValue, data }
}

const getYearlyRecordsData = async (
  filter,
  year,
  aggregationField,
  groupField
) => {
  const unit = filter.unit
  delete filter.unit // Remove unit from the filter

  // Define the aggregation pipeline
  let aggregationPipeline

  if (aggregationField === 'quantity') {
    // Handle conversion for quantity only
    aggregationPipeline = [
      { $match: filter },
      {
        $project: {
          quantity: {
            $cond: {
              if: { $eq: [unit, 'KL'] }, // If the selected unit is KL
              then: {
                $cond: {
                  if: { $eq: ['$unit', 'MTS'] }, // If record unit is MTS
                  then: {
                    $multiply: [{ $divide: ['$quantity', '$density'] }, 1000]
                  }, // Convert MTS to KL
                  else: '$quantity' // Keep KL as is
                }
              },
              else: {
                // If the selected unit is MTS
                $cond: {
                  if: { $eq: ['$unit', 'KL'] }, // If record unit is KL
                  then: {
                    $divide: [{ $multiply: ['$quantity', '$density'] }, 1000]
                  }, // Convert KL to MTS
                  else: '$quantity' // Keep MTS as is
                }
              }
            }
          },
          month: { $month: { $add: ['$date', 5.5 * 60 * 60 * 1000] } },
          year: { $year: { $add: ['$date', 5.5 * 60 * 60 * 1000] } }
        }
      },
      {
        $group: {
          _id: year
            ? {
                month: '$month',
                year: '$year'
              }
            : { $month: '$month' },
          [groupField]: { $sum: '$quantity' } // Sum the adjusted quantities
        }
      },
      { $sort: year ? { '_id.year': 1, '_id.month': 1 } : { _id: 1 } }
    ]
  } else {
    // For other aggregation fields, use the default logic
    aggregationPipeline = [
      { $match: filter },
      {
        $group: {
          _id: year
            ? {
                month: { $month: { $add: ['$date', 5.5 * 60 * 60 * 1000] } },
                year: { $year: { $add: ['$date', 5.5 * 60 * 60 * 1000] } }
              }
            : { $month: { $add: ['$date', 5.5 * 60 * 60 * 1000] } },
          [groupField]: { $sum: `$${aggregationField}` }
        }
      },
      { $sort: year ? { '_id.year': 1, '_id.month': 1 } : { _id: 1 } }
    ]
  }

  const recordsData = await Sales.aggregate(aggregationPipeline)

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ]

  const data = Array.from({ length: 12 }, (_, index) => {
    const monthIndex = index + 1
    const monthData = year
      ? recordsData.find(
          (data) =>
            data._id.month === monthIndex && data._id.year === Number(year)
        ) || {}
      : recordsData.find((data) => data._id === monthIndex) || {}

    return {
      month: monthIndex,
      [groupField]: monthData[groupField] || 0,
      shortName: monthNames[index]
    }
  })

  const totalYearValue = data.reduce((sum, month) => sum + month[groupField], 0)
  return { totalYearValue, data }
}

const getQuantityRecordsData = async (filter, year, month) => {
  return getRecordsData(filter, year, month, 'quantity', 'totalQuantity')
}

const getSalesRecordsData = async (filter, year, month) => {
  return getRecordsData(filter, year, month, 'paidAmount', 'totalSales')
}

export const lookUpClients = async (request, reply) => {
  try {
    const clients = await Customers.find().distinct('customerName')
    const sortClients = clients.sort()
    reply
      .code(200)
      .send({ message: 'Name Fetch Successfully', clients: sortClients })
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}
export const lookUpCustomers = async (request, reply) => {
  try {
    const clients = await Customers.find().populate({
      path: 'leadId',
      select: 'customerName companyName' // दोनों को select किया
    })

    const customers = clients.map((customer) => ({
      id: customer?.leadId?._id || null,
      customerName: customer?.leadId?.customerName || 'N/A',
      companyName: customer?.leadId?.companyName || 'N/A'
    }))

    reply.code(200).send({
      message: 'Customers fetched successfully',
      clients: customers
    })
  } catch (error) {
    reply.code(500).send({
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

export const lookupCompanyName = async (request, reply) => {
  try {
    const companyName = await Customers.find().distinct('companyName')
    reply.send(companyName?.sort())
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Failed to fetch comany data.', errors: error.message })
  }
}
