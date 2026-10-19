import { States } from '../models/index.js'
import { SUPPORTED_COUNTRIES, DEFAULT_COUNTRY } from '../models/States.js'

export const getStates = async (request, reply) => {
  try {
    const { country } = request.query || {}

    const filter = country ? { country } : {}
    const states = await States.find(filter).sort({ country: 1, state: 1 })

    // Documents seeded before countries existed have no `country`; treat them
    // as India so older records keep working without a migration.
    const normalized = states.map((doc) => {
      const state = doc.toObject()
      return { ...state, country: state.country || DEFAULT_COUNTRY }
    })

    reply.send(normalized)
  } catch (error) {
    reply.code(500).send({ message: 'Failed to fetch states data.' })
  }
}

export const getCountries = async (request, reply) => {
  try {
    reply.send(SUPPORTED_COUNTRIES)
  } catch (error) {
    reply.code(500).send({ message: 'Failed to fetch countries.' })
  }
}
