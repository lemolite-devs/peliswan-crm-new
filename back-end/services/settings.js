import Settings from '../models/Settings.js'

//POST API
export const addSetting = async (request, reply) => {
  try {
    const { key, value } = request.body

    // Check if the setting with the given key already exists

    let setting = await Settings.findOne({ key })

    if (setting) {
      // Ensure `setting.value` is an array before pushing
      if (!Array.isArray(setting.value)) {
        setting.value = [] // Initialize it as an empty array if not already an array
      }

      const oldValue = [...setting.value]

      oldValue.push(value)

      setting.value = oldValue
      await setting.save()
      reply
        .code(200)
        .send({ message: 'Description added successfully', setting })
    } else {
      // If the key doesn't exist, create a new setting with the given key and value
      const newSetting = new Settings({ key, value: [value] })
      await newSetting.save()
      reply
        .code(200)
        .send({ message: 'Setting created successfully', setting: newSetting })
    }
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}

//GET API
export const getSettings = async (request, reply) => {
  try {
    const { key } = request.query

    const setting = await Settings.findOne({ key })

    if (!setting) {
      return reply.code(404).send({ message: 'Description Not Found' })
    }

    reply.code(200).send({ id: setting._id || '', values: setting.value || [] })
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}

// PUT API
export const updateSetting = async (request, reply) => {
  try {
    const { id } = request.params
    const { definitions } = request.body

    const result = await Settings.findByIdAndUpdate(id, {
      $set: {
        value: definitions
      }
    })

    if (!result) {
      return reply.code(404).send({ message: 'Setting not found' })
    }

    reply.code(200).send({ message: 'Value updated successfully', result })
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Internal Server Error', error: error.message })
  }
}
