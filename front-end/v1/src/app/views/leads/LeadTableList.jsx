import React from 'react'
import { DataGrid, useGridApiRef } from '@mui/x-data-grid'
import { Box, IconButton, Tooltip } from '@mui/material'
import useAuth from 'app/hooks/useAuth'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import SwapHorizontalCircleIcon from '@mui/icons-material/SwapHorizontalCircle'
import { useState } from 'react'
import ConfirmDeleteDialog from 'app/components/Delete/ConfirmDeleteDialog'
import { styled } from '@mui/material/styles'
import { DEFAULT_COUNTRY, formatPhone } from 'app/utils/constant'

const statusColors = {
  hot: '#f44336',
  cold: '#1976D2',
  warm: '#F57C00',
  'follow up': '#4caf50',
  irrelevant: '#9e9e9e',
  others: '#512DA8',
  other: '#512DA8',
  'old im': '#455A64'
}
// 2. Background color helper
const getBackgroundColor = (color, coefficient = 0.14) => ({
  backgroundColor: `${color}${Math.floor(coefficient * 255)
    .toString(16)
    .padStart(2, '0')}`,
  '&:hover': {
    backgroundColor: `${color}${Math.floor((coefficient - 0.05) * 255)
      .toString(16)
      .padStart(2, '0')}`
  }
})

const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
  ...Object.entries(statusColors).reduce(
    (acc, [status, color]) => ({
      ...acc,
      [`& .status-${status.toLowerCase().replace(/\s+/g, '-')}`]: {
        ...getBackgroundColor(color)
      }
    }),
    {}
  ),
  // Highlight leads that have been converted to a customer.
  // Two-class specificity so it wins over the status-color background above.
  '& .MuiDataGrid-row.row-converted': {
    backgroundColor: '#e0f2f1',
    borderLeft: '4px solid #00796b',
    fontWeight: 600,
    '&:hover': {
      backgroundColor: '#b2dfdb'
    }
  }
}))

const formatProductNames = (productDetails) => {
  return productDetails
    .map(
      (item) =>
        `<span style="display:block; font-size:14px; color:white;">${item.name}</span>`
    )
    .join('')
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

export default function LeadTableList({
  handleViewDetails,
  handleEditModal,
  selectedLeads,
  tableData,
  paginationModel,
  setPaginationModel,
  totalLeads,
  loading,
  handleDelete,
  setRowSelectionModel,
  rowSelectionModel,
  any,
  setLeadViewActiveTab
}) {
  const apiRef = useGridApiRef()
  const {
    hasPermission,
    leadColumnVisibilityModel,
    setLeadColumnVisibilityModel
  } = useAuth()
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const handleDeleteClick = (itemId) => {
    setItemToDelete(itemId)
    setConfirmDeleteOpen(true)
  }

  const columns = [
    {
      field: '_id',
      headerName: 'No',
      width: 60,
      minWidth: 60,
      maxWidth: 200,
      sortable: false,
      disableColumnMenu: true,
      valueGetter: (params) => {
        const page = apiRef.current.state.pagination.paginationModel.page
        const pageSize =
          apiRef.current.state.pagination.paginationModel.pageSize
        const rowIndex = apiRef.current.getRowIndexRelativeToVisibleRows(params)

        return page * pageSize + (rowIndex + 1)
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      resizable: false,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {hasPermission('Leads:view') && (
            <IconButton
              onClick={() => {
                handleViewDetails(params.id)
              }}
              color="primary"
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          )}
          {hasPermission('Leads:edit') && (
            <IconButton
              onClick={() => {
                handleEditModal(params.id)
              }}
              color="success"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {hasPermission('Leads:delete') && (
            <IconButton
              onClick={() => {
                handleDeleteClick(params.id)
              }}
              sx={{ color: 'red' }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
          {params.row?.history?.length > 0 && (
            <SwapHorizontalCircleIcon
              sx={{
                color: 'success.main',
                opacity: 0.7,
                '&:hover': {
                  cursor: 'not-allowed'
                }
              }}
            />
          )}
        </div>
      )
    },
    { field: 'customerName', headerName: 'Name', flex: 1, width: 200 },
    {
      field: 'companyName',
      headerName: 'Company Name',
      flex: 1,
      renderCell: (params) =>
        Array.isArray(params.row.companyName)
          ? params.row.companyName.join(', ')
          : params.row.companyName
    },
    {
      field: 'mobileNumber',
      headerName: 'Mobile Number',
      sortable: false,
      disableColumnMenu: true,
      flex: 1,
      renderCell: (params) =>
        Array.isArray(params.row.mobileNumber)
          ? params.row.mobileNumber
              .map((number) => formatPhone(number, params.row))
              .join(', ')
          : formatPhone(params.row.mobileNumber, params.row) || 'N/A'
    },

    ...(any?.role !== 'Sales Executive'
      ? [
          {
            field: 'assignedToName',
            headerName: 'Assigned To',
            flex: 1
          }
        ]
      : []),
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      width: 200,
      renderCell: (params) => {
        // Converted leads show a "Customer" badge instead of their status.
        if (params.row.isCustomer) {
          const color = '#00796b'
          return (
            <span
              style={{
                fontWeight: 'bold',
                border: `2px solid ${color}`,
                borderRadius: '4px',
                padding: '2px 10px',
                backgroundColor: `${color}15`
              }}
            >
              Customer
            </span>
          )
        }
        const color = statusColors[params.row.status?.toLowerCase()]
        return (
          <span
            style={{
              fontWeight: 'bold',
              border: `2px solid ${color}`,
              borderRadius: '4px',
              padding: '2px 10px',
              backgroundColor: `${color}15` // Adding slight background
            }}
          >
            {params.row.status}
          </span>
        )
      }
    },
    {
      field: 'createdAt',
      headerName: 'Date',
      flex: 1,
      renderCell: (params) => formatDate(params.row.createdAt)
    },
    {
      field: 'country',
      headerName: 'Country',
      flex: 1,
      // Leads saved before countries existed are Indian.
      renderCell: (params) => params.row.country || DEFAULT_COUNTRY
    },
    { field: 'state', headerName: 'State', flex: 1 },
    { field: 'city', headerName: 'City', flex: 1 },
    {
      field: 'products',
      headerName: 'Products',
      flex: 1,
      renderCell: (params) => (
        <>
          {params.row.productDetails.length > 1 ? (
            <Tooltip
              title={
                <span
                  dangerouslySetInnerHTML={{
                    __html: formatProductNames(params.row.productDetails)
                  }}
                />
              }
              arrow
            >
              <span>
                {params.row.productDetails
                  .slice(0, 2)
                  .map((item) => item.name)
                  .join(', ') +
                  (params.row.productDetails.length > 2 ? ', ...' : '')}
              </span>
            </Tooltip>
          ) : (
            <span>
              {params.row.productDetails.map((item) => item.name).join(', ')}
            </span>
          )}
        </>
      )
    },

    {
      field: 'activities',
      headerName: 'Activity',
      flex: 1,
      renderCell: (params) => {
        if (params.row.latestActivity) {
          const description = params.row.latestActivity.description || 'N/A'
          return (
            <Tooltip
              title={description}
              onClick={() => {
                handleViewDetails(params.id)
                setLeadViewActiveTab(2)
              }}
            >
              <span>{description}</span>
            </Tooltip>
          )
        }

        return (
          <Tooltip title="N/A">
            <span>N/A</span>
          </Tooltip>
        )
      }
    }
  ]

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      handleDelete(itemToDelete)
      setItemToDelete(null)
    }
    setConfirmDeleteOpen(false)
  }

  const handleCancelDelete = () => {
    setItemToDelete(null)
    setConfirmDeleteOpen(false)
  }

  return (
    <>
      <Box width="100%" overflow="auto" mb="-10px">
        <StyledDataGrid
          apiRef={apiRef}
          rows={tableData}
          columns={columns}
          checkboxSelection={hasPermission('Leads:transfer')}
          onRowSelectionModelChange={(newRowSelectionModel) => {
            setRowSelectionModel(newRowSelectionModel)
          }}
          rowSelectionModel={rowSelectionModel}
          selectionModel={selectedLeads}
          getRowId={(row) => row._id}
          disableRowSelectionOnClick
          rowHeight={35}
          headerHeight={40}
          pagination
          paginationMode="server"
          rowCount={totalLeads}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 30, 50, 100]}
          initialState={{
            pagination: {
              paginationModel
            }
          }}
          checkboxSelectionVisibleOnly={true}
          loading={loading}
          columnVisibilityModel={leadColumnVisibilityModel}
          onColumnVisibilityModelChange={(newModel) =>
            setLeadColumnVisibilityModel(newModel)
          }
          getRowClassName={(params) =>
            `status-${params.row.status
              ?.toLowerCase()
              .replace(/\s+/g, '-')}${params.row.isCustomer ? ' row-converted' : ''}`
          }
          sx={{
            '& .MuiDataGrid-row': {
              fontSize: '0.8rem'
            },
            '& .MuiDataGrid-columnHeaders': {
              fontSize: '0.9rem'
            }
          }}
        />
      </Box>
      {confirmDeleteOpen && (
        <ConfirmDeleteDialog
          open={confirmDeleteOpen}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          itemName={
            itemToDelete
              ? tableData.find((item) => item._id === itemToDelete)
                  ?.customerName
              : ''
          }
        />
      )}
    </>
  )
}
