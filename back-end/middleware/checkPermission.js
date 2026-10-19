const checkPermission = (permissionName) => {
  return async (request, reply) => {
    try {
      const { user } = request
      if (!user.permissions.includes(permissionName)) {
        throw new Error('Permission denied')
      }
      return true
    } catch (error) {
      reply.code(403).send({ error: 'Permission denied' })
    }
  }
}

export default checkPermission
