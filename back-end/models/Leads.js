import mongoose, { Schema } from 'mongoose'

import {
  COUNTRY_NAMES,
  DIAL_CODES,
  DEFAULT_COUNTRY,
  DEFAULT_DIAL_CODE
} from './States.js'

// Single source of truth for representative types. Must stay in sync with
// `dropdownOptions.representative` in the front-end (src/app/utils/constant.js).
export const REPRESENTATIVE_TYPES = [
  'Trader',
  'Manufacturer',
  'Owner',
  'End User',
  'Others',
  'TBD'
]

const notificationSchema = new Schema(
  {
    message: String,
    baseDate: { type: String, default: '' }, // original selected date
    dueDate: Date, // reminder due date (aligned with baseDate)
    user: { type: Schema.Types.ObjectId, ref: 'user' },
    isReadTrue: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
)

const activitySchema = new mongoose.Schema(
  {
    description: String,
    user: { type: Schema.Types.ObjectId, ref: 'user' },
    isCallTrue: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
)
const gstDetailSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false
    },
    uploadedFile: {
      filename: {
        type: String,
        required: false
      },
      contentType: {
        type: String,
        required: false
      },
      data: {
        type: Buffer,
        required: false
      }
    }
  },
  {
    timestamps: true
  }
)

const addressesSchema = new mongoose.Schema(
  {
    companyName: String,
    billingAddress: {
      address: String,
      state: String,
      city: String,
      zipCode: String
    },
    shippingAddress: {
      address: String,
      state: String,
      city: String,
      zipCode: String
    },
    isBillingAndShippingSame: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
)

const leadSchema = new Schema(
  {
    customerName: String,
    companyName: [{ type: String, required: false }],
    mobileNumber: [{ type: String }],
    gstDetails: [gstDetailSchema],
    email: {
      type: String,
      required: false
    },
    zipCode: String,
    status: {
      type: String
    },
    country: {
      type: String,
      enum: COUNTRY_NAMES,
      default: DEFAULT_COUNTRY
    },
    // Dial code shared by every number in `mobileNumber` for this lead.
    phoneCountryCode: {
      type: String,
      enum: DIAL_CODES,
      default: DEFAULT_DIAL_CODE
    },
    state: String,
    city: String,
    products: [{ type: Schema.Types.ObjectId, ref: 'item' }],
    representative: {
      type: String,
      enum: REPRESENTATIVE_TYPES
    },
    competitorName: String,
    competitorRate: { type: Number, default: null },
    quantity: Number,
    unit: String,
    comments: String,
    reminders: [notificationSchema],
    inquiries: {
      type: String,
      enum: [
        'IndiaMART',
        'TradeIndia',
        'Facebook',
        'Whatsapp',
        'Instagram',
        'References'
      ]
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'user' },
    activities: [activitySchema],
    meeting: { type: Boolean, default: false },
    meetingType: {
      type: String,
      enum: ['', 'regularMeeting', 'hotMeeting'],
      default: ''
    },
    requestSample: { type: Boolean, default: false },
    visitPlant: { type: Boolean, default: false },
    visitOffice: { type: Boolean, default: false },
    remark: {
      type: String,
      enum: [
        'No Answer',
        'Call Later',
        'Interested',
        'Not Interested',
        'Switch Off',
        'Other'
      ]
    },
    deliveryDestination: [String],
    addresses: [addressesSchema],
    isCustomer: { type: Boolean, default: false },
    addedBy: { type: Schema.Types.ObjectId, ref: 'user' },
    history: [
      {
        action: { type: String, enum: ['TRANSFER'] },
        from: { type: Schema.Types.ObjectId, ref: 'user' },
        to: { type: Schema.Types.ObjectId, ref: 'user' },
        date: { type: Date, default: Date.now }
      }
    ],
    latestActivity: {
      updatedAt: {
        type: Date,
        default: null
      },
      description: {
        type: String,
        default: null
      }
    }
  },
  {
    timestamps: true
  }
)

leadSchema.index({ country: 1 })
leadSchema.index({ assignedTo: 1 })
leadSchema.index({ products: 1 })
leadSchema.index({ 'latestActivity.updatedAt': -1 })
const Leads = mongoose.model('lead', leadSchema)
export default Leads
