import mongoose from 'mongoose'
import axios from 'axios'

import { States } from '../models/index.js'

export const migrateStateCity = async (countryCode, countryName) => {
  try {
    if (!countryName) {
      throw new Error(
        'countryName is required so the imported states can be scoped to a country.'
      )
    }

    // Step 1: Clear existing data for this country only, so importing one
    // country never wipes another's states.
    await States.deleteMany({ country: countryName })
    console.log(`Cleared existing states and cities for ${countryName}.`)

    // Step 2: Fetch all states from the API
    const statesResponse = await axios.get(
      `https://api.countrystatecity.in/v1/countries/${countryCode}/states`,
      {
        headers: {
          'X-CSCAPI-KEY': `${process.env.CSCAPI_KEY}`
        }
      }
    )
    const states = statesResponse.data

    if (!states || states.length === 0) {
      throw new Error('No states found in the API response.')
    }

    console.log(`Fetched ${states.length} states from the API.`)

    // Step 3: Process each state to fetch its cities and save to the database
    for (const { id, name, iso2 } of states) {
      try {
        // Fetch cities for the current state
        const citiesResponse = await axios.get(
          `https://api.countrystatecity.in/v1/countries/${countryCode}/states/${iso2}/cities`,
          {
            headers: {
              'X-CSCAPI-KEY': `${process.env.CSCAPI_KEY}`
            }
          }
        )
        const cities = citiesResponse.data

        if (!cities || cities.length === 0) {
          console.warn(`No cities found for state: ${name}`)
          continue
        }

        // Extract unique city names
        const uniqueCityNames = [...new Set(cities.map((city) => city.name))]

        // Create a new States document and save it to the database
        const stateDocument = new States({
          country: countryName,
          state: name,
          cities: uniqueCityNames
        })

        await stateDocument.save()
        console.log(
          `Saved state: ${name} with ${uniqueCityNames.length} unique cities.`
        )
      } catch (stateError) {
        console.error(`Error processing state ${name}:`, stateError.message)
      }
    }

    console.log('Migration completed successfully.')
  } catch (error) {
    console.error('Error :>>', error)
    console.error('Migration failed:', error.message)
  }
}

// migrateStateCity('IN', 'India')
// migrateStateCity('NP', 'Nepal')
