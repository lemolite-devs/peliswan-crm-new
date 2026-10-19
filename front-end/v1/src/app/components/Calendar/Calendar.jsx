import React from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Box } from '@mui/material'

export default function Calendar({
  handleDateSelect,
  handleEventClick,
  initialAnnouncements
}) {
  // Custom function to render the event content
  const renderEventContent = (eventInfo) => {
    return (
      <div
        style={{
          whiteSpace: 'normal',
          wordWrap: 'break-word'
        }}
      >
        <b>{eventInfo.timeText}</b>
        <br />
        <div
          style={{
            backgroundColor: '#1976d2',
            color: 'white',
            borderRadius: '5px',
            padding: '2px',
            marginTop: '2px'
          }}
        >
          {' '}
          <span>{eventInfo.event.title}</span>
        </div>
      </div>
    )
  }

  const highlightToday = (info) => {
    const today = new Date().toDateString()
    const cellDate = info.date.toDateString()

    if (cellDate === today) {
      info.el.style.backgroundColor = '#85FF7A'
      info.el.style.color = '#000'
      // info.el.style.fontWeight = 'bold'
      // info.el.style.border = '2px solid #1976d2'
      // info.el.style.borderRadius = '5px'
    }
  }
  return (
    <Box
      sx={{
        position: 'relative', // Ensures the z-index applies correctly
        zIndex: 10 // Set a z-index for the FullCalendar container
      }}
    >
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        headerToolbar={{
          left: 'prev,next today', // Add 'today' button
          center: 'title',
          right: 'dayGridMonth,dayGridWeek'
        }}
        buttonText={{
          today: 'Today',
          month: 'Month',
          week: 'Week'
        }}
        initialView="dayGridMonth"
        editable={false}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        initialEvents={initialAnnouncements}
        select={handleDateSelect}
        eventContent={renderEventContent} // Custom rendering of events
        eventClick={handleEventClick}
        width={800}
        height={560}
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short' // Shows AM/PM
        }} // Customize time format
        dayCellDidMount={(info) => highlightToday(info)}
      />
    </Box>
  )
}
