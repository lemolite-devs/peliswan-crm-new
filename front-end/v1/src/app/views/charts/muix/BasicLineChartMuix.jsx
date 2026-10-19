import { width } from '@mui/system'
import { LineChart } from '@mui/x-charts/LineChart'

import { useMediaQuery, useTheme } from '@mui/material'

// Helper function to format large numbers more concisely
const formatLargeNumber = (num) => {
  const absNum = Math.abs(num)
  if (absNum >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (absNum >= 1000) return `${(num / 1000).toFixed(0)}K`
  return num.toString()
}

export default function BasicLineChartMuix({
  xAxisData = [],
  seriesData = [],
  xAxisLabel = 'X-Axis',
  yAxisLabel = 'Y-Axis'
}) {
  const maxY = Math.max(...seriesData)
  const minY = Math.min(...seriesData)
  const range = maxY - minY
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')) // Mobile devices

  // Calculate optimal tick values
  const calculateTicks = () => {
    const tickCount = 5 // Reduced number of ticks
    const step = range / (tickCount - 1)
    return Array.from({ length: tickCount }, (_, i) =>
      Math.round(minY + step * i)
    )
  }

  const customTicks = calculateTicks()
  // Responsive chart dimensions
  const getChartDimensions = () => {
    if (isMobile) return { height: 500, width: 300 }

    return { height: 500, width: 1200 }
  }

  const { height, width } = getChartDimensions()

  return (
    <LineChart
      xAxis={[
        {
          label: xAxisLabel,
          data: xAxisData,
          scaleType: 'point',
          tickLabelStyle: {
            angle: 0,
            textAnchor: 'start',
            fontSize: 12
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
          // labelStyle: {
          //   transform: 'translateX(0%) translateY(100%) rotate(0deg)'
          // }
        }
      ]}
      series={[
        {
          data: seriesData,
          color: '#4E79A7',
          points: {
            size: 6,
            color: 'red',
            shape: '#4E79A7'
          }
        }
      ]}
      height={height}
      width={width}
    />
  )
}
