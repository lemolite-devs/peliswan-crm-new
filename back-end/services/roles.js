import { Roles } from '../models/index.js'

export const getRoles = async (request, reply) => {
  try {
    const roles = await Roles.find().sort({ createdAt: 1 })
    reply.send(roles)
  } catch (error) {
    reply.code(500).send({ message: 'Failed to fetch roles.' })
  }
}

export const updateRolePermissions = async (request, reply) => {
  const { id } = request.params
  const { permissions } = request.body

  try {
    const updatedRole = await Roles.findByIdAndUpdate(
      id,
      { permissions },
      { new: true, runValidators: true }
    )

    if (!updatedRole) {
      return reply.code(404).send({ message: 'Role not found.' })
    }

    reply.send(updatedRole)
  } catch (error) {
    reply.code(500).send({
      message: 'Failed to update role permissions.',
      error: error.message
    })
  }
}
