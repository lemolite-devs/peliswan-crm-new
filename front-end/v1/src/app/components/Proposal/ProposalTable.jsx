import React from 'react'
import {
  Box,
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  IconButton,
  styled,
  CircularProgress
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye'
import { useState } from 'react'
import ConfirmDeleteDialog from '../Delete/ConfirmDeleteDialog'
import moment from 'moment'
import ProposalDetailsModal from './ProposalDetailModel'
import useAuth from 'app/hooks/useAuth'

const StyledTable = styled(Table)(() => ({
  whiteSpace: 'nowrap',
  '& thead': {
    '& tr': { '& th': { paddingLeft: 0, paddingRight: 0 } }
  },
  '& tbody': {
    '& tr': { '& td': { paddingLeft: 0, textTransform: 'capitalize' } }
  }
}))

const SrNoTableCell = styled(TableCell)(() => ({
  width: '50px', // Adjust the width as needed
  textAlign: 'left'
}))

const ProposalTable = ({
  proposals,
  handleEdit,
  handleDelete,
  handleView,
  loading,
  totalProposals,
  fetchProposals,
  setLimit,
  limit,
  setCurrentPage,
  currentPage
}) => {
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedProposalId, setSelectedProposalId] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProposal, setSelectedProposal] = useState(null)
  const { hasPermission } = useAuth()

  const handleChangePage = (_, newPage) => {
    setCurrentPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setLimit(+event.target.value)
    setCurrentPage(0)
  }

  const handleDeleteClick = (proposalId) => {
    setSelectedProposalId(proposalId)
    setOpenDeleteDialog(true)
  }

  const handleConfirmDelete = () => {
    if (selectedProposalId) {
      handleDelete(selectedProposalId)
    }
    setOpenDeleteDialog(false)
  }

  const handleCancelDelete = () => {
    setOpenDeleteDialog(false)
    setSelectedProposalId(null)
  }
  const handleViewClick = (proposal) => {
    setSelectedProposal(proposal)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedProposal(null)
  }

  return (
    <Box width="100%" overflow="auto" mt="20px" mb="-10px">
      <StyledTable>
        <TableHead>
          <TableRow>
            <SrNoTableCell align="left">No.</SrNoTableCell>
            <TableCell
              align="left"
              sx={{ width: { xs: '150px', sm: '150px', md: '150px' } }}
            >
              Proposal To
            </TableCell>
            <TableCell
              align="left"
              sx={{ width: { xs: '150px', sm: '150px', md: '150px' } }}
            >
              Subject
            </TableCell>
            <TableCell
              align="left"
              sx={{ width: { xs: '150px', sm: '150px', md: '150px' } }}
            >
              Related To
            </TableCell>
            <TableCell
              align="left"
              sx={{ width: { xs: '150px', sm: '150px', md: '150px' } }}
            >
              Date
            </TableCell>
            <TableCell
              align="left"
              sx={{ width: { xs: '150px', sm: '150px', md: '150px' } }}
            >
              Mobile No
            </TableCell>
            <TableCell
              align="left"
              sx={{ width: { xs: '150px', sm: '150px', md: '150px' } }}
            >
              State
            </TableCell>
            <TableCell
              align="left"
              sx={{ width: { xs: '120px', sm: '120px', md: '120px' } }}
            >
              City
            </TableCell>
            <TableCell
              align="center"
              sx={{ width: { xs: '140px', sm: '140px', md: '140px' } }}
            >
              Action
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={9} align="center">
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : proposals?.length > 0 ? (
            proposals.map((proposal, index) => (
              <TableRow key={proposal._id}>
                <SrNoTableCell>{currentPage * limit + index + 1}</SrNoTableCell>
                <TableCell align="left">{proposal.proposalTo}</TableCell>
                <TableCell align="left">{proposal.subject}</TableCell>
                <TableCell align="left">{proposal.relatedTo}</TableCell>
                <TableCell align="left">
                  {moment(proposal.date).format('DD-MM-YYYY')}
                </TableCell>
                <TableCell align="left">{proposal.mobileNumber}</TableCell>
                <TableCell align="left">{proposal.state}</TableCell>
                <TableCell align="left">{proposal.city}</TableCell>
                <TableCell align="center">
                  <IconButton
                    onClick={() => handleViewClick(proposal)}
                    color="primary"
                    aria-label={`view ${proposal.title}`}
                  >
                    <RemoveRedEyeIcon />
                  </IconButton>

                  {hasPermission('Sales.Proposals:edit') && (
                    <IconButton
                      onClick={() => handleEdit(proposal._id)}
                      color="success"
                      aria-label={`edit ${proposal.title}`}
                    >
                      <EditIcon />
                    </IconButton>
                  )}

                  {hasPermission('Sales.Proposals:delete') && (
                    <IconButton
                      onClick={() => handleDeleteClick(proposal._id)}
                      sx={{ color: 'red' }}
                      aria-label={`delete ${proposal.title}`}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} align="center">
                No data available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </StyledTable>

      <ConfirmDeleteDialog
        open={openDeleteDialog}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        itemName={
          Array.isArray(proposals)
            ? proposals.find((proposal) => proposal._id === selectedProposalId)
                ?.title
            : ''
        }
      />
      <ProposalDetailsModal
        open={modalOpen}
        onClose={handleCloseModal}
        proposals={selectedProposal}
      />
      <TablePagination
        sx={{ px: 2 }}
        page={currentPage}
        component="div"
        rowsPerPage={limit}
        count={totalProposals}
        onPageChange={handleChangePage}
        rowsPerPageOptions={[10, 20, 30, 50, 100]}
        onRowsPerPageChange={handleChangeRowsPerPage}
        nextIconButtonProps={{ 'aria-label': 'Next Page' }}
        backIconButtonProps={{ 'aria-label': 'Previous Page' }}
      />
    </Box>
  )
}

export default ProposalTable
