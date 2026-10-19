// middleware/allowedRoles.js
const allowedRoles = (roles) => {
  return async (request, reply) => {
    const { user } = request
    if (!roles.includes(user.role)) {
      return reply.status(403).send({ message: 'Forbidden: Insufficient role' })
    }
  }
}

export default allowedRoles
