import mongoose from 'mongoose'
import SalesTarget from '../models/salesTarget.js'
import Users from '../models/Users.js'
import Sales from '../models/Sales.js'

// post api
export const addTarget = async (request, reply) => {
  try {
    const { salesExecutiveId, targetQuantity, unit, month, year } = request.body

    const newSalesTarget = new SalesTarget({
      salesExecutiveId,
      targetQuantity,
      unit,
      // achievedQuantity: 0,
      month,
      year,
      createdBy: request.user.userId
    })

    await newSalesTarget.save()
    reply.code(201).send(newSalesTarget)
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}

// GET api
export const getTarget = async (request, reply) => {
  try {
    const {
      month = null,
      year,
      salesExecutiveId = null,
      state = null,
      quantity = null
    } = request.query

    const query = {}
    if (month) {
      query.month = month
    }
    if (year) {
      query.year = year
    }
    if (state) {
      query.state = state
    }
    if (salesExecutiveId) {
      query.salesExecutiveId = salesExecutiveId
    }
    if (quantity) {
      query.unit = quantity
    }

    const salesTargets = await SalesTarget.find(query).populate({
      path: 'salesExecutiveId',
      select: 'name'
    })

    reply.code(200).send(salesTargets)
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}

// GET by ID
export const getTargetById = async (request, reply) => {
  try {
    const { id } = request.params

    const { month, year } = request.query

    const salesTarget = await SalesTarget.find({
      salesExecutiveId: id,
      month: month,
      year: year
    }).populate({
      path: 'salesExecutiveId',
      select: 'name'
    })
    if (!salesTarget) {
      return reply.code(404).send({ error: 'Sales target not found' })
    }

    reply.code(200).send(...salesTarget)
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}

export const updateOrCreateTarget = async (request, reply) => {
  try {
    const {
      salesExecutiveId,
      targetQuantity,
      unit,
      month,
      year,
      state,
      achievedQuantity
    } = request.body

    // Check if achievedQuantity is negative (if provided)
    if (achievedQuantity !== undefined && achievedQuantity < 0) {
      return reply
        .code(400)
        .send({ message: 'Achieved quantity cannot be negative' })
    }

    // Prepare the search criteria based on month, year, and salesExecutiveId
    const searchCriteria = {
      salesExecutiveId,
      month,
      year
    }

    // Search for an existing sales target document
    const salesTarget = await SalesTarget.findOne(searchCriteria)

    // If a document is found, update it with the new values
    if (salesTarget) {
      // Update only if the month and year are the same
      salesTarget.targetQuantity =
        targetQuantity !== undefined
          ? targetQuantity
          : salesTarget.targetQuantity
      salesTarget.unit = unit !== undefined ? unit : salesTarget.unit
      salesTarget.state = state !== undefined ? state : salesTarget.state
      salesTarget.achievedQuantity =
        achievedQuantity !== undefined
          ? achievedQuantity
          : salesTarget.achievedQuantity

      // Save the updated document
      await salesTarget.save()

      return reply
        .code(200)
        .send({ message: 'Sales target updated', salesTarget })
    }

    // If no matching document is found, create a new one
    const newSalesTarget = new SalesTarget({
      salesExecutiveId,
      targetQuantity,
      unit,
      month,
      year,
      state,
      achievedQuantity,
      createdBy: request.user.userId
    })

    // Save the new document to the database
    await newSalesTarget.save()
    return reply
      .code(201)
      .send({ message: 'New sales target created', newSalesTarget })
  } catch (error) {
    console.error('Error in updateOrCreateTarget:', error)
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}

export const getProgress = async (request, reply) => {
  try {
    const { month = null, year, state = null, quantity = null } = request.query

    const filter = {}
    if (request.user.role === 'Sales Executive') {
      filter._id = request.user.userId
    }

    const allExecutives = await Users.find(filter)
      .sort({ updatedAt: -1 })
      .select('role name')
      .populate({
        path: 'role',
        select: 'name'
      })

    // query for filter
    const query = {}

    if (filter._id) {
      query.salesExecutiveId = filter._id
    }
    if (year) {
      query.year = Number(year) || null
    }
    if (month) {
      query.month = Number(month) || null
    }
    if (state) {
      query.state = state
    }
    if (quantity) {
      query.unit = quantity
    }
    const salesTargets = await SalesTarget.find(query)
    const salesTargetMap = salesTargets.reduce((map, target) => {
      map[target.salesExecutiveId] = target
      return map
    }, {})

    const progressData = allExecutives?.map((executive) => {
      const { _id: salesExecutiveId } = executive

      const target = salesTargetMap[salesExecutiveId]

      const saleQuantity = target ? target.saleQuantity : 0
      const targetQuantity = target ? target.targetQuantity : 0
      const progressPercentage =
        target && target.targetQuantity > 0
          ? (saleQuantity / target.targetQuantity) * 100
          : 0

      return {
        salesExecutiveId,
        executive: executive?.name,
        saleQuantity,
        targetQuantity,
        progressPercentage:
          Number(progressPercentage?.toFixed(2)) > 100
            ? 100
            : Number(progressPercentage?.toFixed(2)),
        unit: target ? target?.unit : null,
        month: target ? target?.month : null,
        year: target ? target?.year : null,
        state: target ? target?.state : null,
        createdBy: target ? target?.createdBy : null,
        createdAt: target ? target?.createdAt : null,
        updatedAt: target ? target?.updatedAt : null
      }
    })

    // Sort progress data by progressPercentage in descending order
    progressData.sort((a, b) => b.progressPercentage - a.progressPercentage)

    reply.send({ progressData })
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}

export const getSalesTargetWithSalesData = async (request, reply) => {
  try {
    const { salesExecutiveId, month, year, state, city } = request.query
    // Validation for required fields
    if (!salesExecutiveId) {
      return reply.code(400).send({ message: 'salesExecutiveId is required' })
    }

    // Build the match filter for SalesTarget
    const matchFilter = {
      salesExecutiveId: salesExecutiveId,
      month: parseInt(month, 10),
      year: parseInt(year, 10)
    }

    // Perform aggregation to match SalesTarget and join with Sales data
    const salesTargetWithSales = await SalesTarget.aggregate([
      {
        $match: matchFilter
      },
      {
        $lookup: {
          from: 'sales', // The collection to join ('sales' collection)
          localField: 'salesExecutiveId', // The field from SalesTarget to match
          foreignField: 'user', // The field from Sales to match
          as: 'salesData' // The name of the output array that will contain the matched sales
        }
      },
      {
        $unwind: {
          path: '$salesData', // Unwind the salesData array for each match
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          ...(state && {
            'salesData.state': { $regex: new RegExp(state, 'i') }
          }), // Case-insensitive match for state
          ...(city && { 'salesData.city': { $regex: new RegExp(city, 'i') } })
        }
      },
      {
        $project: {
          _id: 1,
          salesExecutiveId: 1,
          targetQuantity: 1,
          saleQuantity: 1,
          unit: 1,
          month: 1,
          year: 1,
          createdBy: 1,
          salesData: {
            customerName: 1,
            tankerNo: 1,
            invoiceNo: 1,
            companyName: 1,
            product: 1,
            state: 1,
            city: 1,
            quantity: 1,
            unit: 1,
            date: 1,
            addedBy: 1,
            payment: 1,
            paidAmount: 1
          }
        }
      }
    ])

    // If no data is found, return a 404 response
    if (!salesTargetWithSales.length) {
      return reply.code(404).send({ message: 'No data found' })
    }

    // Send the aggregated sales target with sales data
    return reply.code(200).send(salesTargetWithSales)
  } catch (error) {
    console.error('Error fetching sales target with sales data:', error)
    return reply.code(500).send({
      message: 'Failed to retrieve sales target with sales data.',
      error: error.message
    })
  }
}

export const getSalesChartData = async (request, reply) => {
  try {
    const { id } = request.params // Sales Executive ID
    const { year = null, state = null, quantity = null } = request.query

    // Match filter based on user inputs
    const matchFilter = {
      salesExecutiveId: id ? new mongoose.Types.ObjectId(id) : null
    }
    if (year) {
      matchFilter.year = parseInt(year)
    }
    if (state) {
      matchFilter['salesData.state'] = state // Match state from joined sales data
    }
    if (quantity) {
      matchFilter.unit = quantity // Example: filter based on unit
    }

    // Aggregation pipeline
    const pipeline = [
      {
        $match: matchFilter // Apply the filters
      },
      {
        $lookup: {
          from: 'sales', // Collection name for the Sales table
          localField: 'executiveId', // Field to match in SalesTarget
          foreignField: 'user', // Field to match in Sales
          as: 'salesData' // Alias for joined sales data
        }
      },
      {
        $unwind: {
          path: '$salesData', // Unwind salesData for filtering
          preserveNullAndEmptyArrays: true // Keep documents even without matching sales data
        }
      }
      // {
      //   $group: {
      //     _id: { month: '$month' }, // Group by month
      //     targetQuantity: { $sum: '$targetQuantity' }, // Sum target quantities
      //     saleQuantity: { $sum: '$salesData.quantity' } // Sum sale quantities from sales data
      //   }
      // }
      // {
      //   $project: {
      //     _id: 0,
      //     month: '$_id.month', // Extract month
      //     targetQuantity: 1, // Include targetQuantity
      //     saleQuantity: 1 // Include saleQuantity
      //   }
      // }
    ]

    // Execute the pipeline
    const salesChartData = await SalesTarget.aggregate(pipeline)

    // Initialize arrays for targetQuantity and saleQuantity for each month
    const targetQuantity = new Array(12).fill(0)
    const saleQuantity = new Array(12).fill(0)

    // Populate arrays with aggregated data
    salesChartData.forEach((data) => {
      const monthIndex = data.month - 1 // Month is 1-based, adjust to 0-based index
      targetQuantity[monthIndex] = data.targetQuantity || 0
      saleQuantity[monthIndex] = data.saleQuantity || 0
    })

    // Respond with the aggregated data
    reply.code(200).send({
      targetQuantity,
      saleQuantity
    })
  } catch (error) {
    console.error('Error fetching sales chart data:', error.message)
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}
