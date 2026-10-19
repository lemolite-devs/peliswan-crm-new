import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Box,
  Grid
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import PersonIcon from '@mui/icons-material/Person'
import SubjectIcon from '@mui/icons-material/Subject'
import LinkIcon from '@mui/icons-material/Link'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import PhoneIcon from '@mui/icons-material/Phone'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import LocationCityIcon from '@mui/icons-material/LocationCity'
import moment from 'moment'

import { Worker, Viewer } from '@react-pdf-viewer/core'
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout'
import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/default-layout/lib/styles/index.css'
import axiosInstance from 'axiosInstance'

// Define TabPanel component to render the content of each tab
const TabPanel = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && (
        <Box p={3}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  )
}

const ProposalDetailsModal = ({ open, onClose, proposals }) => {
  const [tabIndex, setTabIndex] = useState(0)
  const [file, setFile] = useState(null)
  const [contentType, setContentType] = useState('')

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue)
  }
  // Create an instance of the default layout plugin
  const defaultLayoutPluginInstance = defaultLayoutPlugin()

  useEffect(() => {
    const fetchProposal = async (id) => {
      try {
        if (tabIndex === 1 && proposals) {
          const result = await axiosInstance.get(`/api/proposal/${id}`)
          if (result.status === 200) {
            const { data } = result.data.uploadedFile
            const { contentType } = result.data.uploadedFile
            const base64URL = `data:${contentType};base64,${data}`
            setFile(base64URL)
            setContentType(contentType)
          }
        }
      } catch (error) {
        console.error('Error fetching file:', error)
      }
    }

    if (tabIndex === 1 && proposals) {
      fetchProposal(proposals._id)
    }
  }, [tabIndex, proposals])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500]
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {/* Tabs to toggle between Proposal Details and Document Preview */}
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          aria-label="proposal tabs"
        >
          <Tab label="Proposal Details" />
          <Tab label="Document Preview" />
        </Tabs>

        {/* Content for each tab */}
        <TabPanel value={tabIndex} index={0}>
          {/* Proposal Details Content */}
          {proposals ? (
            <>
              {/* Left-aligned ProposalTo with the icon next to the text */}
              <Box display="flex" alignItems="center" mb={2}>
                <PersonIcon />
                <Typography variant="h6" ml={1}>
                  Proposal To: {proposals.proposalTo}
                </Typography>
              </Box>

              {/* Grid Layout: 2 Columns */}
              <Grid container spacing={2}>
                {/* Left side with the first 3 fields */}
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <SubjectIcon />
                    <Typography ml={1}>Subject: {proposals.subject}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    <LinkIcon />
                    <Typography ml={1}>
                      Related To: {proposals.relatedTo}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    <CalendarTodayIcon />
                    <Typography ml={1}>
                      Date: {moment(proposals.date).format('DD-MM-YYYY')}
                    </Typography>
                  </Box>
                </Grid>

                {/* Right side with the remaining 3 fields */}
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <PhoneIcon />
                    <Typography ml={1}>
                      Mobile No: {proposals.mobileNumber}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    <LocationOnIcon />
                    <Typography ml={1}>State: {proposals.state}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    <LocationCityIcon />
                    <Typography ml={1}>City: {proposals.city}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </>
          ) : (
            <Typography>No proposal details available.</Typography>
          )}
        </TabPanel>

        <TabPanel value={tabIndex} index={1}>
          {/* Document Preview Content */}
          {file ? (
            contentType === 'application/pdf' ? (
              <Worker
                workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}
              >
                <div
                  style={{
                    height: '600px',
                    border: '1px solid rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <Viewer
                    fileUrl={file}
                    plugins={[defaultLayoutPluginInstance]}
                  />
                </div>
              </Worker>
            ) : (
              <img src={file} alt="Proposal" width="600" height="400" />
            )
          ) : (
            <Typography>No document available for preview.</Typography>
          )}
        </TabPanel>
      </DialogContent>
    </Dialog>
  )
}

export default ProposalDetailsModal
