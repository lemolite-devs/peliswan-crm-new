import os from 'os'
import xlsx from 'xlsx'
import path from 'path'
import fs from 'fs'
import { pipeline } from 'stream/promises'
import salesHistory from '../models/salesHistory.js'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek.js'

dayjs.extend(isoWeek)
// Map Excel headers to Mongoose schema keys
const mapKeys = (row) => ({
  companyName: row['Company Name'],
  voucherNumber: row['Voucher Number'],
  reference: row['Reference'],
  date: row['Date'] ? new Date((row['Date'] - 25569) * 86400 * 1000) : null,
  voucherType: row['Voucher Type'],
  partyName: row['Party Name'],
  partyAlias: row['Party Alias'],
  consigneeBuyer: row['Consignee/Buyer'],
  partyAddress: row['Party Address'],
  partyPincode: row['Party Pincode'],
  partyContactPerson: row['Party Contact Person'],
  partyTelephoneNo: row['Party Telephone No.'],
  partyMobileNo: row['Party Mobile No.'],
  partyFaxNo: row['Party Fax No.'],
  partyEmail: row['Party E-Mail'],
  partyGroup: row['Party Group'],
  partyState: row['Party State'],
  partyNotes: row['Party Notes'],
  placeOfReceiptByShipper: row['Place of Receipt by Shipper'],
  vesselFlightNo: row['Vessel/Flight No.'],
  portOfLoading: row['Port of Loading'],
  portOfDischarge: row['Port of Discharge'],
  destinationCountry: row['Destination Country'],
  modeTermsOfPayment: row['Mode/Terms of Payment'],
  otherReferences: row['Other Reference(s)'],
  orderNumber: row['Order Number'],
  despatchDocNo: row['Despatch Doc. No.'],
  despatchThrough: row['Despatch through'],
  destination: row['Destination'],
  trackingNumber: row['Tracking Number'],
  buyersTINNo: row["Buyer's TIN No."],
  cstNumber: row['CST Number'],
  gstinUIN: row['GSTIN/UIN'],
  itemName: row['Item Name'],
  itemAlias: row['Item Alias'],
  itemPartNo: row['Item Part No'],
  itemGroup: row['Item Group'],
  itemCategory: row['Item Category'],
  itemDescription: row['Item Description'],
  itemNotes: row['Item Notes'],
  itemTcsNog: row['Item TCS NOG'],
  itemTariffClass: row['Item Tariff Class'],
  mrpMarginal: row['MRP/Marginal'],
  itemHsn: row['Item HSN'],
  itemRateOfGst: Number(row['Item rate of GST']) || 0,
  godown: row['Godown'],
  itemBatch: row['Item Batch'],
  actualQuantity: Number(row['Acutal Quantity']) || 0,
  billedQuantity: Number(row['Billed Quantity']) || 0,
  rate: Number(row['Rate']) || 0,
  purchaseRate: Number(row['Purchase Rate']) || 0,
  unit: row['Unit'],
  discount: Number(row['Discount']) || 0,
  margin: Number(row['Margin']) || 0,
  amount: Number(row['Amount']) || 0,
  purchaseSalesLedger: row['Purchase/Sales Ledger'],
  taxClassification: row['Tax Classification'],
  narration: row['Narration']
})

export const uploadExcel = async (req, reply) => {
  const parts = req.parts()
  let fileStream
  let filename

  for await (const part of parts) {
    if (part.file) {
      fileStream = part.file
      filename = part.filename
      break
    }
  }

  if (!fileStream || !filename) {
    return reply.code(400).send({ message: 'No file uploaded' })
  }

  const tempPath = path.join(os.tmpdir(), `${Date.now()}-${filename}`)
  const writeStream = fs.createWriteStream(tempPath)

  try {
    await pipeline(fileStream, writeStream)

    const workbook = xlsx.readFile(tempPath)
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rawData = xlsx.utils.sheet_to_json(sheet)
    const mappedData = rawData.map(mapKeys)

    // 🔥 Overwrite existing salesHistory records
    await salesHistory.deleteMany({})
    await salesHistory.insertMany(mappedData)

    fs.unlinkSync(tempPath)

    reply.code(200).send({
      message: 'Excel data overwritten successfully',
      insertedCount: mappedData.length
    })
  } catch (error) {
    console.error('Upload error:', error)
    reply.code(500).send({
      message: 'Something went wrong',
      error: error.message
    })
  }
}

export const getSalesChartData = async (req, reply) => {
  try {
    const {
      range = 'monthly',
      itemName,
      partyName,
      partyState,
      destination,
      metric = 'amount',
      startDate: customStart,
      endDate: customEnd
    } = req.query

    const allowedMetrics = ['amount', 'quantity', 'avgRate', 'margin']
    if (!allowedMetrics.includes(metric)) {
      return reply
        .status(400)
        .send({ success: false, message: 'Invalid metric' })
    }

    const match = {}
    // Handle itemName filter
    if (itemName) {
      if (Array.isArray(itemName)) {
        match.itemName = { $in: itemName }
      } else {
        match.itemName = { $regex: new RegExp(`^${itemName}$`, 'i') }
      }
    }

    // Handle partyName filter
    if (partyName) {
      if (Array.isArray(partyName)) {
        match.partyName = { $in: partyName }
      } else {
        match.partyName = { $regex: new RegExp(`^${partyName}$`, 'i') }
      }
    }

    // Handle partyState filter
    if (partyState) {
      if (Array.isArray(partyState)) {
        match.partyState = { $in: partyState }
      } else {
        match.partyState = { $regex: new RegExp(`^${partyState}$`, 'i') }
      }
    }

    // Handle destination filter
    if (destination) {
      if (Array.isArray(destination)) {
        match.destination = { $in: destination }
      } else {
        match.destination = { $regex: new RegExp(`^${destination}$`, 'i') }
      }
    }

    // Set date range
    const now = dayjs()
    let startDate, endDate
    switch (range) {
      case 'daily':
        startDate = now.startOf('week')
        endDate = now.endOf('week')
        break
      case 'weekly':
        startDate = now.startOf('month')
        endDate = now.endOf('month')
        break
      case 'monthly':
        startDate = now.startOf('year')
        endDate = now.endOf('year')
        break
      case 'quarterly':
        startDate = now.startOf('year')
        endDate = now.endOf('year')
        break
      case 'yearly':
        startDate = now.subtract(5, 'year').startOf('year')
        endDate = now.endOf('year')
        break
      case 'custom':
        if (!customStart || !customEnd) {
          return reply.status(400).send({
            success: false,
            message: 'Custom range requires startDate and endDate'
          })
        }
        startDate = dayjs(customStart)
        endDate = dayjs(customEnd)
        break
      default:
        return reply
          .status(400)
          .send({ success: false, message: 'Invalid range' })
    }

    match.date = { $gte: startDate.toDate(), $lte: endDate.toDate() }

    // Grouping setup
    let groupStage
    let labels = []
    let idField

    switch (range) {
      case 'daily':
        groupStage = { $dayOfWeek: '$date' }
        idField = 'day'
        labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        break
      case 'weekly':
        groupStage = { $isoWeek: '$date' }
        idField = 'week'
        labels = Array.from({ length: 5 }, (_, i) => `Week ${i + 1}`)
        break
      case 'monthly':
        groupStage = { $month: '$date' }
        idField = 'month'
        labels = [
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
        break
      case 'quarterly':
        groupStage = '$quarter'
        idField = 'quarter'
        labels = ['Q1', 'Q2', 'Q3', 'Q4']
        break
      case 'yearly':
        groupStage = { $year: '$date' }
        idField = 'year'
        labels = Array.from({ length: 6 }, (_, i) =>
          (now.year() - 5 + i).toString()
        )
        break
      case 'custom':
        groupStage = { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
        idField = 'day'
        let temp = startDate.clone()
        while (temp.isBefore(endDate) || temp.isSame(endDate, 'day')) {
          labels.push(temp.format('YYYY-MM-DD'))
          temp = temp.add(1, 'day')
        }
        break
    }

    // MongoDB pipeline
    const pipeline = [{ $match: match }]

    if (range === 'quarterly') {
      pipeline.push({
        $addFields: {
          quarter: { $ceil: { $divide: [{ $month: '$date' }, 3] } }
        }
      })
    }

    pipeline.push({
      $group: {
        _id: groupStage,
        totalAmount: { $sum: '$amount' },
        totalQuantity: { $sum: '$billedQuantity' },
        totalGST: {
          $sum: { $multiply: ['$amount', { $divide: ['$itemRateOfGst', 100] }] }
        },
        count: { $sum: 1 },
        avgRate: { $avg: '$rate' },
        totalMargin: { $sum: '$margin' }
      }
    })

    pipeline.push({
      $project: {
        [idField]: '$_id',
        totalAmount: 1,
        totalQuantity: 1,
        totalGST: 1,
        count: 1,
        avgRate: 1,
        totalMargin: 1,
        _id: 0
      }
    })

    pipeline.push({ $sort: { [idField]: 1 } })

    const results = await salesHistory.aggregate(pipeline)

    const getMetricValue = (r) => {
      switch (metric) {
        case 'amount':
          return r.totalAmount || 0
        case 'quantity':
          return r.totalQuantity || 0
        case 'avgRate':
          return r.avgRate || 0
        case 'margin':
          return r.totalMargin || 0
      }
    }

    const chartData = labels.map((label, i) => {
      let found
      if (range === 'custom') found = results.find((r) => r.day === label)
      else if (range === 'quarterly')
        found = results.find((r) => r.quarter === i + 1)
      else if (range === 'yearly')
        found = results.find((r) => r.year === parseInt(label))
      else if (range === 'monthly')
        found = results.find((r) => r.month === i + 1)
      else if (range === 'weekly') found = results.find((r) => r.week === i + 1)
      else if (range === 'daily')
        found = results.find((r) => r.dayOfWeek === i + 1 || r.day === i + 1)
      return { label, value: getMetricValue(found || {}) }
    })

    const metricFieldMap = {
      amount: { $sum: '$amount' },
      quantity: { $sum: '$billedQuantity' },
      avgRate: { $avg: '$rate' }, // fixed typo
      margin: { $sum: '$margin' }
    }

    const metricField = metricFieldMap[metric] || metricFieldMap['amount']

    const stateAggMetric = await salesHistory.aggregate([
      { $match: match },
      { $group: { _id: '$partyState', value: metricField } },
      { $project: { state: '$_id', value: 1, _id: 0 } }
    ])

    // Convert to key-value
    const mapData = stateAggMetric.reduce((acc, item) => {
      acc[item.state] = { value: item.value }
      return acc
    }, {})

    // City-wise metric aggregation
    const cityAggMetric = await salesHistory.aggregate([
      { $match: match },
      {
        $group: {
          _id: { state: '$partyState', city: '$destination' },
          value: metricField
        }
      },
      { $project: { state: '$_id.state', city: '$_id.city', value: 1, _id: 0 } }
    ])

    const cityMapData = cityAggMetric.reduce((acc, item) => {
      acc[item.city] = { state: item.state, value: item.value }
      return acc
    }, {})

    const stateWiseData = await salesHistory.aggregate([
      { $match: match },
      { $group: { _id: '$partyState', value: metricField } },
      { $sort: { value: -1 } },
      { $limit: 10 },
      { $project: { state: '$_id', value: 1, _id: 0 } }
    ])

    const partyWiseData = await salesHistory.aggregate([
      { $match: match },
      { $group: { _id: '$partyName', value: metricField } },
      { $sort: { value: -1 } },
      { $limit: 10 },
      { $project: { party: '$_id', value: 1, _id: 0 } }
    ])

    const destinationWiseData = await salesHistory.aggregate([
      { $match: match },
      { $group: { _id: '$destination', value: metricField } },
      { $sort: { value: -1 } },
      { $limit: 10 },
      { $project: { destination: '$_id', value: 1, _id: 0 } }
    ])

    const ItemWiseData = await salesHistory.aggregate([
      { $match: match },
      { $group: { _id: '$itemName', value: metricField } },
      { $sort: { value: -1 } },
      { $limit: 10 },
      { $project: { itemName: '$_id', value: 1, _id: 0 } }
    ])

    const summaryData = await salesHistory.aggregate([
      { $match: match }, // 👈 filters + date range applied
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalQuantity: { $sum: '$billedQuantity' },

          totalTransactions: { $sum: 1 },
          avgRate: { $avg: '$rate' },
          totalMargin: { $sum: '$margin' }
        }
      },
      {
        $project: {
          _id: 0,
          totalAmount: 1,
          totalQuantity: 1,
          avgRate: 1,
          totalMargin: 1
        }
      }
    ])

    const summary = summaryData[0] || {
      totalAmount: 0,
      totalQuantity: 0,
      avgRate: 0,
      totalMargin: 0
    }

    const metricPieData = await salesHistory.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$itemName', // you can change this to '$partyState' or '$partyName' as needed
          value: metricField // metricField is already selected based on 'metric'
        }
      },
      { $sort: { value: -1 } },
      { $limit: 10 },
      { $project: { label: '$_id', value: 1, _id: 0 } }
    ])

    return reply.status(200).send({
      success: true,
      range,
      metric,
      filters: { itemName, partyName, partyState, destination },
      data: chartData,
      mapData,
      cityMapData,
      stateWiseData,
      partyWiseData,
      ItemWiseData,
      destinationWiseData,
      summary,
      metricPieData
    })
  } catch (error) {
    console.error('Error fetching sales chart data:', error)
    return reply.status(500).send({
      success: false,
      message: 'Failed to fetch sales chart data',
      error: error.message
    })
  }
}

export const getPieChartData = async (req, reply) => {
  try {
    const { range = 'monthly' } = req.query

    const now = dayjs()
    let startDate, endDate

    switch (range) {
      case 'daily':
        startDate = now.startOf('week')
        endDate = now.endOf('week')
        break
      case 'weekly':
        startDate = now.startOf('month')
        endDate = now.endOf('month')
        break
      case 'monthly':
        startDate = now.startOf('year')
        endDate = now.endOf('year')
        break
      case 'yearly':
        startDate = now.subtract(5, 'year').startOf('year')
        endDate = now.endOf('year')
        break
      default:
        return reply
          .code(400)
          .send({ success: false, message: 'Invalid range' })
    }

    const invoices = await salesHistory.find({
      date: { $gte: startDate.toDate(), $lte: endDate.toDate() }
    })

    const groupByField = (field) => {
      const map = new Map()
      for (const inv of invoices) {
        const key = inv[field] || 'Unknown'
        const amount = Number(inv.amount || 0)
        map.set(key, (map.get(key) || 0) + amount)
      }

      const sorted = [...map.entries()]
        .sort((a, b) => b[1] - a[1]) // Sort by amount descending
        .slice(0, 10) // Take top 10

      return sorted.map(([label, value]) => ({ label, value }))
    }

    const pieData = {
      byItemName: groupByField('itemName'),
      byPartyName: groupByField('partyName'),
      byState: groupByField('partyState')
    }

    return reply.code(200).send({ success: true, range, data: pieData })
  } catch (err) {
    console.error('Pie Chart Error:', err)
    return reply.code(500).send({ success: false, message: 'Server Error' })
  }
}

// controller/getAllUniqueFilters.js

export const getAllUniqueFilters = async (req, reply) => {
  try {
    const items = await salesHistory.distinct('itemName')
    const parties = await salesHistory.distinct('partyName')
    const states = await salesHistory.distinct('partyState')
    const destinations = await salesHistory.distinct('destination')

    // Helper function: clean data (remove null/empty, trim, unique, sort)
    const cleanArray = (arr) => {
      return [
        ...new Set(arr.filter((x) => x && x.trim() !== '').map((x) => x.trim()))
      ].sort()
    }

    const data = {
      items: cleanArray(items),
      parties: cleanArray(parties),
      states: cleanArray(states),
      destinations: cleanArray(destinations)
    }

    return reply.code(200).send({
      success: true,
      message: 'Filters fetched successfully',
      data
    })
  } catch (err) {
    req.log.error(err)
    return reply.code(500).send({
      success: false,
      message: 'Internal Server Error'
    })
  }
}
