import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'

import States, { DEFAULT_COUNTRY } from '../models/States.js'

dotenv.config({ path: path.join(process.cwd(), 'back-end', '.env') })

// Nepal's 7 provinces with their districts and major municipalities.
// Mirrors the shape of the existing India data (one document per
// state/province, `cities` holding the selectable locations beneath it).
export const NEPAL_PROVINCES = [
  {
    state: 'Koshi',
    cities: [
      'Biratnagar',
      'Bhojpur',
      'Damak',
      'Dhankuta',
      'Dharan',
      'Gaighat',
      'Ilam',
      'Inaruwa',
      'Itahari',
      'Jhapa',
      'Khandbari',
      'Khotang',
      'Mechinagar',
      'Morang',
      'Myanglung',
      'Okhaldhunga',
      'Panchthar',
      'Phidim',
      'Rajbiraj',
      'Sankhuwasabha',
      'Solukhumbu',
      'Sunsari',
      'Taplejung',
      'Terhathum',
      'Udayapur',
      'Urlabari'
    ]
  },
  {
    state: 'Madhesh',
    cities: [
      'Bara',
      'Birgunj',
      'Dhanusha',
      'Gaur',
      'Golbazar',
      'Jaleshwar',
      'Janakpur',
      'Kalaiya',
      'Lahan',
      'Mahottari',
      'Malangwa',
      'Parsa',
      'Rautahat',
      'Saptari',
      'Sarlahi',
      'Siraha'
    ]
  },
  {
    state: 'Bagmati',
    cities: [
      'Banepa',
      'Bharatpur',
      'Bhaktapur',
      'Bidur',
      'Chitwan',
      'Dhading',
      'Dhulikhel',
      'Dolakha',
      'Hetauda',
      'Kathmandu',
      'Kavrepalanchok',
      'Lalitpur',
      'Makwanpur',
      'Nuwakot',
      'Ramechhap',
      'Rasuwa',
      'Sindhuli',
      'Sindhupalchok'
    ]
  },
  {
    state: 'Gandaki',
    cities: [
      'Baglung',
      'Besisahar',
      'Damauli',
      'Gorkha',
      'Kaski',
      'Kushma',
      'Lamjung',
      'Manang',
      'Mustang',
      'Myagdi',
      'Nawalpur',
      'Parbat',
      'Pokhara',
      'Putalibazar',
      'Syangja',
      'Tanahun',
      'Waling'
    ]
  },
  {
    state: 'Lumbini',
    cities: [
      'Arghakhanchi',
      'Banke',
      'Bardiya',
      'Butwal',
      'Dang',
      'Ghorahi',
      'Gulmi',
      'Kapilvastu',
      'Lumbini',
      'Nepalgunj',
      'Palpa',
      'Parasi',
      'Pyuthan',
      'Rolpa',
      'Rukum East',
      'Rupandehi',
      'Sandhikharka',
      'Siddharthanagar',
      'Tansen',
      'Tulsipur'
    ]
  },
  {
    state: 'Karnali',
    cities: [
      'Birendranagar',
      'Dailekh',
      'Dolpa',
      'Humla',
      'Jajarkot',
      'Jumla',
      'Kalikot',
      'Mugu',
      'Rukum West',
      'Salyan',
      'Surkhet'
    ]
  },
  {
    state: 'Sudurpashchim',
    cities: [
      'Achham',
      'Baitadi',
      'Bajhang',
      'Bajura',
      'Bhimdatta',
      'Dadeldhura',
      'Darchula',
      'Dhangadhi',
      'Doti',
      'Kailali',
      'Kanchanpur',
      'Tikapur'
    ]
  }
]

/**
 * Idempotent: back-fills `country: 'India'` onto the pre-existing state
 * documents, then upserts Nepal's provinces. Safe to re-run.
 */
export const seedNepal = async () => {
  const backfill = await States.updateMany(
    { country: { $exists: false } },
    { $set: { country: DEFAULT_COUNTRY } }
  )
  console.log(
    `Back-filled country="${DEFAULT_COUNTRY}" on ${backfill.modifiedCount} existing state(s).`
  )

  for (const { state, cities } of NEPAL_PROVINCES) {
    await States.updateOne(
      { country: 'Nepal', state },
      { $set: { country: 'Nepal', state, cities } },
      { upsert: true }
    )
    console.log(`Upserted Nepal province: ${state} (${cities.length} cities).`)
  }

  console.log('Nepal seed completed successfully.')
}

// Allow `node back-end/config/seedNepal.js` as a one-off migration.
const isDirectRun =
  process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('seedNepal.js')

if (isDirectRun) {
  const dbUri = process.env.MONGODB_URI
  if (!dbUri) {
    console.error('❌ No MONGODB_URI found! Please check your .env file.')
    process.exit(1)
  }

  try {
    await mongoose.connect(dbUri)
    console.log('✅ MongoDB connected.')
    await seedNepal()

    // Non-fatal: the data is already written, and the unique index only fails
    // to build if the collection already holds duplicate country/state pairs.
    try {
      await States.syncIndexes()
      console.log('✅ Indexes synced.')
    } catch (indexError) {
      console.warn(
        `⚠️  Could not sync indexes (seed itself succeeded): ${indexError.message}`
      )
    }
  } catch (error) {
    console.error('Seed failed:', error.message)
    process.exitCode = 1
  } finally {
    await mongoose.disconnect()
  }
}
