// routes/exampleRoutes.js
import fastifyPlugin from 'fastify-plugin'
import verifyToken from '../middleware/verifyToken.js'
import ExampleModel from '../models/exampleModel.js'
import { Users, Roles, Items, States, Leads } from '../models/index.js'
import { getExamples } from '../services/examples.js'
import path from 'node:path'
import util from 'node:util'
import { pipeline } from 'node:stream'
const pump = util.promisify(pipeline)
import xlsx from 'xlsx'
import { fileURLToPath } from 'url'
import fs from 'node:fs'
import { encrypt } from '../utils/cryptoUtils.js'
import items from './items.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const addRoles = async () => {
  try {
    const roles = ['Admin', 'Sales Executive', 'Sales Manager']

    for (const roleName of roles) {
      const role = new Roles({ name: roleName })
      await role.save()
    }
    console.log('Roles added successfully')
  } catch (error) {
    console.error('Error adding roles:', error)
  }
}

const createUsers = async () => {
  try {
    const roles = await Roles.find({
      name: { $in: ['Admin', 'Sales Executive', 'Sales Manager'] }
    })

    const users = [
      {
        name: 'John Doe',
        userID: 'admin01',
        email: 'john.doe@example.com',
        password: 'password', // Ideally, passwords should be hashed
        role: roles.find((role) => role.name === 'Admin')._id,
        mobileNumber: '1234567890',
        city: 'New York'
      },
      {
        name: 'Jane Smith',
        userID: 'salesexec01',
        email: 'jane.smith@example.com',
        password: 'password', // Ideally, passwords should be hashed
        role: roles.find((role) => role.name === 'Sales Executive')._id,
        mobileNumber: '0987654321',
        city: 'Los Angeles'
      },
      {
        name: 'Bob Johnson',
        userID: 'salesmanager01',
        email: 'bob.johnson@example.com',
        password: 'password', // Ideally, passwords should be hashed
        role: roles.find((role) => role.name === 'Sales Manager')._id,
        mobileNumber: '1122334455',
        city: 'Chicago'
      }
    ]

    for (const userData of users) {
      const user = new Users(userData)
      await user.save()
    }
    console.log('Users added successfully')
  } catch (error) {
    console.error('Error adding users:', error)
  }
}

function excelDateToJSDate(serial) {
  if (!serial || isNaN(serial)) {
    // Return the current date if the input is invalid
    return new Date()
  }

  const utc_days = Math.floor(serial - 25569)
  const utc_value = utc_days * 86400
  const date_info = new Date(utc_value * 1000)

  if (isNaN(date_info.getTime())) {
    // If the calculated date is invalid, return the current date
    return new Date()
  }

  const fractional_day = serial - Math.floor(serial) + 0.0000001
  let total_seconds = Math.floor(86400 * fractional_day)

  const seconds = total_seconds % 60
  total_seconds -= seconds

  const hours = Math.floor(total_seconds / (60 * 60))
  const minutes = Math.floor(total_seconds / 60) % 60

  const finalDate = new Date(
    date_info.getFullYear(),
    date_info.getMonth(),
    date_info.getDate(),
    hours,
    minutes,
    seconds
  )

  return isNaN(finalDate.getTime()) ? new Date() : finalDate // Ensure valid date
}

const convertQty = (quantity) => {
  if (!quantity) return 0

  const quantityValue = parseFloat(quantity.replace(/[^0-9.]/g, ''))
  return quantityValue * 1000
}

const convertQtyL = (quantity) => {
  if (!quantity || isNaN(quantity)) return 0

  // Ensure quantity is treated as a string
  const quantityStr = String(quantity).trim()

  // Check if the string contains a valid number
  const numericMatch = quantityStr.match(/[0-9.]+/)
  if (!numericMatch) return 0 // Return 0 if no valid number is found

  const containsL = /[lL]/.test(quantityStr) // Check for 'L' or 'l'
  const quantityValue = parseFloat(quantityStr.replace(/[^0-9.]/g, '')) || 0 // Extract numeric value or default to 0

  return containsL ? quantityValue / 1000 : quantityValue // Divide by 1000 if 'L' or 'l' is found
}

const usersArray = [
  {
    name: 'User 1',
    email: 'test1@gmail.com',
    password: 'password123',
    roleName: 'Admin',
    mobileNumber: '1234567890',
    city: 'New York'
  },
  {
    name: 'User 2',
    email: 'test2@gmail.com',
    password: 'password123',
    roleName: 'Sales Executive',
    mobileNumber: '0987654321',
    city: 'Los Angeles'
  },
  {
    name: 'User 3',
    email: 'test2@gmail.com',
    password: 'password123',
    roleName: 'Sales Manager',
    mobileNumber: '0987654321',
    city: 'Los Angeles'
  },
  {
    name: 'User 4',
    email: 'test4@gmail.com',
    password: 'password123',
    roleName: 'Admin',
    mobileNumber: '0987654321',
    city: 'Los Angeles'
  },
  {
    name: 'User 5',
    email: 'test5@gmail.com',
    password: 'password123',
    roleName: 'Sales Executive',
    mobileNumber: '0987654321',
    city: 'Los Angeles'
  },
  {
    name: 'User 6',
    email: 'test6@gmail.com',
    password: 'password123',
    roleName: 'Sales Executive',
    mobileNumber: '0987654321',
    city: 'Los Angeles'
  }
]

async function exampleRoutes(fastify, options) {
  fastify.get(
    '/api/examples',
    // { preHandler: verifyToken },

    getExamples
  )

  fastify.post('/api/excel-sheet/leads', async function (req, reply) {
    const data = await req.file()

    const uploadsDir = path.join(process.cwd(), 'uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir)
    }
    const filePath = path.join(uploadsDir, data.filename)
    await pump(data.file, fs.createWriteStream(filePath))

    try {
      const workbook = xlsx.readFile(filePath)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = xlsx.utils.sheet_to_json(worksheet)
      console.log('Read Values :>', jsonData.length)

      // Key-value mappings
      const typeMap = {
        HOT: 'Hot',
        WARM: 'Warm',
        COLD: 'Cold',
        'FOLLOW UP': 'Follow Up',
        'IRRELEVANT ': 'Irrelevant',
        OTHER: 'Others'
      }

      const representativeTypeMap = {
        TRADER: 'Trader',
        MANUFACTURER: 'Manufacturer',
        OWNER: 'Owner',
        'END USER': 'End User',
        OTHER: 'Others'
      }

      const remarkMap = {
        'NO ANSWER': 'No Answer',
        'CALL LATER': 'Call Later',
        INTERESTED: 'Interested',
        'NOT INTERESTED': 'Not Interested',
        'SWITCH OFF': 'Switch Off',
        OTHER: 'Other'
      }

      const result = await Items.find()

      // Create a map of item names to IDs
      const itemsMap = result.reduce((map, item) => {
        map[item.name] = item._id
        return map
      }, {})

      const newMappings = {
        'C9 SOLVENT': 'RELIANCE C9',
        'Recycled base Oil': 'base oil',
        'FURNACE OIL': 'FO G1',
        'N 70 ': 'N70',
        'Fule oil': 'FUEL OIL',
        LDO: 'LDO G1',
        CBFS: 'CBFS',
        LHSH: 'LSHS',
        LLP: 'LLP WHITE OIL',
        'N 60': 'N60',
        mho: 'MHO',
        bo: 'BO',
        'Mixed Paraffin': 'PARAFFIN',
        SN70: 'SN 70',
        'LDO G3': 'LDO G1',
        bd: 'BD',
        'black oil': 'LDO G1',
        'furnace oil': 'FO G1',
        'fuel oil': 'FUEL OIL',
        'BASE OIL ': 'base oil',
        RBO: 'RPO',
        'Naphtha ': 'Naphtha',
        SN500: 'SN 500',
        NAPHTHA: 'Naphtha',
        Naptha: 'Naphtha',
        naptha: 'Naphtha',
        'MTO Cut': 'MTO CUT',
        mto: 'MTO',
        Bd: 'BD',
        Ahmedabad: 'OTHER',
        Raipur: 'OTHER'
      }

      // Step 1: Replace the values in `newMappings` with IDs from `itemsMap`
      Object.keys(newMappings).forEach((key) => {
        const mapKey = newMappings[key] // Get the mapped key
        if (itemsMap[mapKey]) {
          newMappings[key] = itemsMap[mapKey] // Replace the value with the corresponding ID
        } else {
          newMappings[key] = '66ba020a02a5efbe2287bf9b' // Assign undefined if not found
        }
      })

      // Step 2: Merge `newMappings` into `itemsMap`
      Object.assign(itemsMap, newMappings)

      // Convert date fields and map keys
      const mappedData = jsonData
        .filter((i) => i['MOBILE'])
        .map((item) => {
          // const additionalComments = item['Anshuman - Call Review']
          // const additionalComments = (item.__EMPTY || '').trim()
          const additionalComments = []

          const comments = [item['COMMENTS'], additionalComments]
            .filter(Boolean)
            .map((comment) => comment)
            .join(', ')

          const productKeys = [
            'PRODUCT 1',
            'PRODUCT 2',
            'PRODUCT 3',
            'PRODUCT 4'
          ]
          const products = productKeys
            .map((key) => {
              const value = item[key]
              return typeof value === 'string' && value.trim()
                ? itemsMap[value.trim()]
                : null
            })
            .filter(Boolean)

          return {
            srNo: item['Sr.No.'],
            createdAt: item['INQUIRY DATE']
              ? excelDateToJSDate(item['INQUIRY DATE'])
              : new Date(),
            status: (typeMap[item['TYPE']] || item['TYPE'] || '').trim(),
            companyName: item['COMPANY NAME'],
            customerName: (item['NAME'] || '').trim(),
            mobileNumber: item['MOBILE'] || '',
            email: item['E-MAIL'] || '',
            state: (item['STATE '] || '').trim(),
            city: (item['CITY'] || '').trim(),
            products: products,
            quantity: convertQtyL(item['QUANTITY ()'] || 0),
            unit: 'KL',
            representative: !!item['REPRESENTATIVE TYPE']
              ? representativeTypeMap[item['REPRESENTATIVE TYPE']]
              : 'Other',
            remark: !!item['REMARK'] ? remarkMap[item['REMARK']] : 'Other',
            comments,
            assignedTo: '6772862f1276f687130439cd',
            addedBy: '6772862f1276f687130439cd'
          }
        })

      console.log('Mapped values :> ', mappedData.length)

      // Find unique products
      const uniqueProducts = [
        ...new Set(
          jsonData
            .map((item) => item['PRODUCT 1'])
            .filter((product) => product !== null && product !== undefined)
        )
      ]

      console.log(uniqueProducts, 'unique products')

      // // Check unique products against items map
      // const mappedProducts = uniqueProducts
      //   .map((product) => (itemsMap[product] ? itemsMap[product] : null))
      //   .filter(Boolean)

      const missingProducts = uniqueProducts.filter(
        (product) => !itemsMap[product]
      )

      // Insert missing products into Items collection
      if (missingProducts.length > 0) {
        console.log('New Products that is not in items table.')

        console.table(missingProducts)

        return reply.code(400).send({
          message: 'New Products that is not in items table.',
          products: missingProducts
        })
      } else {
        const batchSize = 500
        for (let i = 0; i < mappedData.length; i += batchSize) {
          const batch = mappedData.slice(i, i + batchSize)
          const r = await Leads.insertMany(batch)
        }
        console.log('mapped  Data 112 :>', mappedData.length)
        reply.send({
          message: 'Data inserted successfully',
          data: mappedData,
          length: mappedData.length
        })
      }
    } catch (error) {
      reply
        .status(500)
        .send({ error: 'Error inserting data: ' + error.message })
    } finally {
      // Clean up the uploaded file
      fs.unlinkSync(filePath)
    }
  })

  fastify.post('/api/excel-sheet/items', async function (req, reply) {
    const data = await req.file()

    const uploadsDir = path.join(process.cwd(), 'uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir)
    }

    const filePath = path.join(uploadsDir, data.filename)

    console.log('File path 82:>', filePath)

    await pump(data.file, fs.createWriteStream(filePath))

    try {
      const workbook = xlsx.readFile(filePath)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = xlsx.utils.sheet_to_json(worksheet)

      // const batchSize = 1000
      // for (let i = 0; i < jsonData.length; i += batchSize) {
      //   const batch = jsonData.slice(i, i + batchSize)
      //   await Items.insertMany(batch)
      // }

      const result = await Items.insertMany(jsonData)

      reply.send({ message: 'Data inserted successfully', result })
    } catch (error) {
      reply
        .status(500)
        .send({ error: 'Error inserting data: ' + error.message })
    } finally {
      // Clean up the uploaded file
      fs.unlinkSync(filePath)
    }
  })

  fastify.post('/api/excel-sheet/states', async function (req, reply) {
    const data = await req.file()

    const uploadsDir = path.join(process.cwd(), 'uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir)
    }

    const filePath = path.join(uploadsDir, data.filename)

    console.log('File path 82:>', filePath)

    await pump(data.file, fs.createWriteStream(filePath))

    try {
      const workbook = xlsx.readFile(filePath)
      const sheetName = workbook.SheetNames[1]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 })

      const states = []

      const headers = jsonData[0].slice(1) // Skip the first column, take headers from the second column onwards
      const citiesData = jsonData.slice(1) // Skip the header row

      headers.forEach((state, index) => {
        const cities = citiesData
          .map((row) => row[index + 1])
          .filter((city) => city) // Skip the first column, map cities
        states.push({ state, cities })
      })

      await States.insertMany(states)

      reply.send({ message: `States : ${states.length} inserted successfully` })
    } catch (error) {
      reply
        .status(500)
        .send({ error: 'Error inserting data: ' + error.message })
    } finally {
      // Clean up the uploaded file
      fs.unlinkSync(filePath)
    }
  })

  fastify.get('/api/demo-users', async function (req, reply) {
    try {
      await addRoles()
      const addedUsers = []

      for (const user of usersArray) {
        const { name, email, password, roleName, mobileNumber, city } = user

        // Find the role by name
        const role = await Roles.findOne({ name: roleName })

        if (!role) {
          console.error(`Invalid role name for user ${name}`)
          continue // Skip this user and move to the next
        }

        // Generate a unique user ID
        const userCount = await Users.countDocuments()
        const userId = `USER${userCount + 1}`

        // Encrypt the password
        const { iv, encryptedData } = encrypt(password)

        // Create a new user
        const newUser = new Users({
          name,
          userID: userId,
          email,
          password: encryptedData,
          iv, // Store the IV along with the encrypted password
          role: role._id,
          mobileNumber,
          city
        })

        // Save the user to the database
        await newUser.save()
        addedUsers.push(newUser)
      }

      return { success: true, addedUsers }
    } catch (error) {
      console.error(error)
      return { success: false, message: 'Internal Server Error' }
    }

    // Example usage
  })

  fastify.get('/api/items-orders', async (req, reply) => {
    try {
      const items = await Items.find({ order: { $exists: false } })

      for (let i = 0; i < items.length; i++) {
        await Items.findByIdAndUpdate(items[i]._id, { order: i })
      }

      return reply.code(200).send({
        message: 'Migration Items completed.'
      })
    } catch (error) {
      console.error('Migration failed:', error)
    }
  })
}

export default fastifyPlugin(exampleRoutes)
