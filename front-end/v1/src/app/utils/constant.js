export const topBarHeight = 64
export const sideNavWidth = 260
export const navbarHeight = 60
export const sidenavCompactWidth = 80
export const containedLayoutWidth = 1200

// Countries leads can belong to. Must stay in sync with SUPPORTED_COUNTRIES in
// the back-end (back-end/models/States.js), which validates the same values.
export const SUPPORTED_COUNTRIES = [
  { name: 'India', dialCode: '+91', zipLength: 6, phoneLength: 10 },
  { name: 'Nepal', dialCode: '+977', zipLength: 5, phoneLength: 10 }
]

export const COUNTRY_NAMES = SUPPORTED_COUNTRIES.map((c) => c.name)
export const DIAL_CODES = SUPPORTED_COUNTRIES.map((c) => c.dialCode)
export const DEFAULT_COUNTRY = 'India'
export const DEFAULT_DIAL_CODE = '+91'

export const getCountryConfig = (countryName) =>
  SUPPORTED_COUNTRIES.find((c) => c.name === countryName) ||
  SUPPORTED_COUNTRIES.find((c) => c.name === DEFAULT_COUNTRY)

// Dial code for a lead, falling back to its country's code (and then India's)
// for records saved before `phoneCountryCode` existed.
export const resolveDialCode = (lead) =>
  lead?.phoneCountryCode || getCountryConfig(lead?.country)?.dialCode

// "+91 9812345678" — used wherever a saved number is displayed.
export const formatPhone = (number, lead) =>
  number ? `${resolveDialCode(lead)} ${number}` : ''

export const dropdownOptions = {
  status: ['Hot', 'Warm', 'Cold', 'Follow Up', 'Irrelevant', 'Others'],
  representative: [
    'Trader',
    'Manufacturer',
    'Owner',
    'End User',
    'Others',
    'TBD'
  ],
  inquiries: [
    'IndiaMART',
    'TradeIndia',
    'Facebook',
    'Whatsapp',
    'Instagram',
    'References'
  ],
  remark: [
    'No Answer',
    'Call Later',
    'Interested',
    'Not Interested',
    'Switch Off',
    'Other'
  ],
  units: ['Barrels', 'KL', 'MTS']
}
