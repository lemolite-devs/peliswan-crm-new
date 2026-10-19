import * as React from 'react'
import { BarChart } from '@mui/x-charts/BarChart'

const formatLargeNumber = (num) => {
  const absNum = Math.abs(num)
  if (absNum >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (absNum >= 1000) return `${(num / 1000).toFixed(0)}K`
  return num.toString()
}

export default function ChartsOverviewDemo({ salesData }) {
  const seriesData = [
    { data: salesData?.targetQuantity || [], label: 'Target' },
    { data: salesData?.saleQuantity || [], label: 'Sales' }
  ]

  return (
    <BarChart
      series={seriesData}
      height={400}
      xAxis={[
        {
          label: 'Month',
          data: [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec'
          ], // Months of the year
          scaleType: 'band'
        }
      ]}
      yAxis={[
        {
          label: 'Quantity',
          scaleType: 'linear',
          valueFormatter: (value) => formatLargeNumber(value)
        }
      ]}
      margin={{ top: 10, left: 40, right: 10 }}
    />
  )
}
