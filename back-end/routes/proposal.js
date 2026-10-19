import fastifyPlugin from 'fastify-plugin'
import verifyToken from '../middleware/verifyToken.js'
import allowedRoles from '../middleware/allowedRoles.js'
import checkPermission from '../middleware/checkPermission.js'
import {
  addProposal,
  getAllProposals,
  getProposalById,
  deleteProposal,
  updateProposal
} from '../services/proposal.js'

async function proposal(fastify, options) {
  fastify.get(
    '/api/proposals',
    { preHandler: [verifyToken, checkPermission('Sales.Proposals:view')] },
    getAllProposals
  )
  fastify.get(
    '/api/proposal/:proposalId',
    { preHandler: [verifyToken, checkPermission('Sales.Proposals:view')] },
    getProposalById
  )
  fastify.post(
    '/api/proposal',
    { preHandler: [verifyToken, checkPermission('Sales.Proposals:add')] },
    addProposal
  )
  fastify.put(
    '/api/proposal/:proposalId',
    { preHandler: [verifyToken, checkPermission('Sales.Proposals:edit')] },
    updateProposal
  )
  fastify.delete(
    '/api/proposal/:proposalId',
    { preHandler: [verifyToken, checkPermission('Sales.Proposals:delete')] },
    deleteProposal
  )
}
export default fastifyPlugin(proposal)
