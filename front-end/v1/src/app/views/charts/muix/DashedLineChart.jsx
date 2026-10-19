import React from 'react'
import {
  LineChart,
  lineElementClasses,
  markElementClasses
} from '@mui/x-charts/LineChart'
import { Typography, useMediaQuery, useTheme } from '@mui/material'
import { Box } from '@mui/system'

// Helper function to format large numbers
const formatLargeNumber = (num) => {
  const absNum = Math.abs(num)
  if (absNum >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (absNum >= 1000) return `${(num / 1000).toFixed(0)}K`
  return num.toString()
}

export default function DashedLineChart({
  xAxisData = [],
  seriesData = [],
  xAxisLabel = 'X-Axis',
  yAxisLabel = 'Y-Axis',
  totalCount
}) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')) // For responsive design

  // Responsive chart dimensions
  const getChartDimensions = () => {
    if (isMobile) return { height: 300, width: 300 }
    return { height: 500, width: 600 }
  }

  const { height, width } = getChartDimensions()

  const maxY = Math.max(...seriesData)
  const minY = Math.min(...seriesData)
  const range = maxY - minY

  // Calculate optimal Y-axis ticks
  const calculateTicks = () => {
    const tickCount = 5
    const step = range / (tickCount - 1)
    return Array.from({ length: tickCount }, (_, i) =>
      Math.round(minY + step * i)
    )
  }

  const customTicks = calculateTicks()

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      <Typography
        sx={{
          fontSize: '1.1rem',
          fontWeight: 'light',
          position: 'absolute',
          top: 10,
          right: 0
        }}
      >
        <span> Total Calls: </span>{' '}
        <span style={{ marginLeft: '4px', fontWeight: '400' }}>
          {totalCount}
        </span>
      </Typography>
      <LineChart
        // width={width}
        height={height}
        series={[{ data: seriesData, id: 'dataSeriesId' }]}
        xAxis={[
          {
            scaleType: 'point',
            data: xAxisData,
            label: xAxisLabel,
            tickLabelStyle: {
              angle: 0,
              textAnchor: 'start',
              fontSize: 9
            }
          }
        ]}
        yAxis={[
          {
            label: yAxisLabel,
            tickValues: customTicks,
            valueFormatter: (value) => formatLargeNumber(value),
            tickLabelStyle: {
              fontSize: 10,
              angle: 0,
              textAnchor: 'end'
            }
          }
        ]}
        sx={{
          [`.${lineElementClasses.root}, .${markElementClasses.root}`]: {
            strokeWidth: 1
          },
          '.MuiLineElement-series-dataSeriesId': {
            strokeDasharray: '5 5' // Dashed line style
          },
          [`.${markElementClasses.root}:not(.${markElementClasses.highlighted})`]:
            {
              fill: '#fff'
            },
          [`& .${markElementClasses.highlighted}`]: {
            stroke: 'none'
          }
        }}
        grid={{ vertical: false, horizontal: true }}
      />
    </Box>
  )
}
