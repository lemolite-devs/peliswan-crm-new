// models/exampleModel.js
import mongoose from 'mongoose'

// Countries leads can belong to. `dialCode` drives the phone country-code
// selector, `zipLength` the postal-code validation (India PIN is 6 digits,
// Nepal's postal code is 5).
export const SUPPORTED_COUNTRIES = [
  { name: 'India', dialCode: '+91', zipLength: 6 },
  { name: 'Nepal', dialCode: '+977', zipLength: 5 }
]

export const COUNTRY_NAMES = SUPPORTED_COUNTRIES.map((c) => c.name)
export const DIAL_CODES = SUPPORTED_COUNTRIES.map((c) => c.dialCode)
export const DEFAULT_COUNTRY = 'India'
export const DEFAULT_DIAL_CODE = '+91'

const stateSchema = new mongoose.Schema(
  {
    country: {
      type: String,
      required: true,
      enum: COUNTRY_NAMES,
      default: DEFAULT_COUNTRY
    },
    state: { type: String, required: true },
    cities: [{ type: String }]
  },
  {
    timestamps: true
  }
)

// A state/province name is only unique within its own country.
stateSchema.index({ country: 1, state: 1 }, { unique: true })

const States = mongoose.model('state', stateSchema)
export default States
