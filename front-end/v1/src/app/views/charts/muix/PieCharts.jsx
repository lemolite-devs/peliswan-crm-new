import React from 'react'
import { PieChart, pieArcLabelClasses } from '@mui/x-charts/PieChart'
import { Typography } from '@mui/material'

const PieCharts = ({
  series = [],
  width = 300,
  height = 468,
  title = '',
  formatQuantity,
  formatAmount,
  metric,
  legend = false
}) => {
  // Defensive check to avoid crash
  const isValidSeries =
    Array.isArray(series) && series.length > 0 && Array.isArray(series[0]?.data)

  const getFormatter = () => {
    if (metric === 'Quantity' && typeof formatQuantity === 'function') {
      return formatQuantity
    }
    if (typeof formatAmount === 'function') {
      return formatAmount
    }
    return (v) => v?.toString()
  }

  const valueFormatter = getFormatter()

  if (!isValidSeries) {
    return (
      <Typography color="error" variant="body2">
        Invalid chart data
      </Typography>
    )
  }

  return (
    <div>
      {title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}
      <PieChart
        series={series.map((s) => ({
          ...s,
          arcLabel: (item) => valueFormatter(item.value),
          arcLabelMinAngle: 10
        }))}
        width={width}
        height={height}
        sx={{
          [`& .${pieArcLabelClasses.root}`]: {
            fontSize: 12,
            fill: '#fff',
            fontWeight: 'bold',
            dx: 10,
            dy: 10
          }
        }}
        margin={{ right: legend ? 250 : 0 }}
        slotProps={{ legend: { hidden: true } }}
      />
    </div>
  )
}

export default PieCharts
