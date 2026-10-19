import Users from '../models/Users.js'
import { decrypt as decryptPassword } from '../utils/cryptoUtils.js'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET

async function authRoutes(fastify) {
  fastify.post('/api/login', async (request, reply) => {
    const { identifier, password } = request.body

    try {
      const user = await Users.findOne({
        $or: [{ email: identifier }, { userID: identifier }]
      }).populate('role')

      if (!user) {
        return reply.status(404).send({ error: 'User not found' })
      }

      const decryptedStoredPassword = decryptPassword(user.password, user.iv)

      if (decryptedStoredPassword !== password) {
        return reply.status(404).send({ error: 'Invalid password' })
      }

      const accessToken = jwt.sign(
        {
          id: user._id,
          email: user.email,
          role: user.role.name,
          name: user.name
        },
        JWT_SECRET,
        { expiresIn: '6d' }
      )
      const refreshToken = jwt.sign(
        { id: user._id, email: user.email },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      )

      user.refreshToken = refreshToken
      await user.save()

      reply.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      })

      return reply.send({
        message: 'Login successful',
        accessToken: accessToken,
        user: {
          id: user._id,
          userID: user.userID,
          role: user.role.name,
          name: user.name,
          email: user.email,
          permissions: user.role.permissions
        }
      })
    } catch (error) {
      console.error('Error during login:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })

  fastify.post('/api/refresh', async (request, reply) => {
    const { refreshToken } = request.cookies

    try {
      if (!refreshToken) {
        return reply.status(401).send({ error: 'No refresh token provided' })
      }

      jwt.verify(refreshToken, JWT_REFRESH_SECRET, async (err, user) => {
        if (err) {
          return reply.status(403).send({ error: 'Invalid refresh token' })
        }

        const dbUser = await Users.findById(user.id).populate('role')
        if (!dbUser || dbUser.refreshToken !== refreshToken) {
          return reply.status(403).send({ error: 'Invalid refresh token' })
        }

        const newAccessToken = jwt.sign(
          { id: dbUser.id, email: dbUser.email, role: dbUser.role.name },
          JWT_SECRET,
          { expiresIn: '15m' }
        )

        return reply.send({
          message: 'Access token refreshed successfully',
          accessToken: newAccessToken
        })
      })
    } catch (error) {
      console.error('Error during token refresh:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}

export default authRoutes
