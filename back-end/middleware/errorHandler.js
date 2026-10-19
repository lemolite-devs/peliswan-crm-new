const errorHandler = (error, request, reply) => {
  const statusCode = error.statusCode || 500
  const message = error.message || 'Internal Server Error'

  reply.status(statusCode).send({
    statusCode,
    message
  })
}

export default errorHandler
