import jwt from 'jsonwebtoken'
import { Users } from '../models/index.js'

const verifyToken = async (request, reply) => {
  try {
    const token = request.headers['authorization']
    if (!token) {
      return reply.status(401).send({ message: 'No token provided' })
    }
    const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET) // Assuming Bearer token

    const user = await Users.findById(decoded.id).populate({
      path: 'role',
      populate: { path: 'permissions' }
    })

    request.user = {
      userId: decoded.id,
      role: decoded.role,
      permissions: user.role ? user.role.permissions : []
    } // Ensure decoded contains `id`
    return
  } catch (err) {
    return reply.status(401).send({ message: 'Unauthorized' })
  }
}

export default verifyToken
