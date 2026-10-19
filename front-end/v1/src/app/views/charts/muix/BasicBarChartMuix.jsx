import React from 'react'
import { BarChart } from '@mui/x-charts/BarChart'
import { Typography } from '@mui/material'

// Helper function to format large numbers
const formatLargeNumber = (num) => {
  const absNum = Math.abs(num)
  if (absNum >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (absNum >= 1000) return `${(num / 1000).toFixed(0)}K`
  return num.toString()
}

// Helper function to calculate optimal tick values
const calculateTicks = (data, tickCount = 5) => {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min
  const step = range / (tickCount - 1)
  return Array.from({ length: tickCount }, (_, i) => Math.round(min + step * i))
}

// Reusable BarChart component
const ReusableBarChart = ({ data, isMonthly, xLabel, yLabel }) => {
  if (!data || data.length === 0) {
    return <Typography>No data available</Typography>
  }

  const chartData = data.map((item) => item.value)
  const ticks = calculateTicks(chartData)
  return (
    <BarChart
      xAxis={[
        {
          scaleType: 'band',
          data: data.map((item) => item.label),
          label: xLabel
        }
      ]}
      yAxis={[
        {
          label: yLabel,
          tickValues: ticks,
          valueFormatter: (value) => formatLargeNumber(value),
          tickLabelStyle: {
            fontSize: 9,
            angle: 0,
            textAnchor: 'end'
          }
        }
      ]}
      series={[
        {
          data: chartData,
          color: '#4E79A7'
        }
      ]}
      borderRadius={8}
      grid={{ vertical: false, horizontal: true }}
    />
  )
}

// Main component
export default function BasicBarChartMuix({
  xLabel,
  isMonthly,
  quantityRecordData,
  overAllSalesData
}) {
  if (quantityRecordData && quantityRecordData.length > 0) {
    const quantityData = quantityRecordData.map((data) => ({
      label: isMonthly ? data.date : data.shortName,
      value: data.totalQuantity
    }))
    return (
      <ReusableBarChart
        data={quantityData}
        xLabel={isMonthly ? 'Days' : 'Months'}
        yLabel="Quantity"
      />
    )
  }

  if (overAllSalesData && overAllSalesData.length > 0) {
    const salesData = overAllSalesData.map((data) => ({
      label: isMonthly ? data.date : data.shortName,
      value: data.totalSales
    }))
    return (
      <ReusableBarChart
        data={salesData}
        xLabel={isMonthly ? 'Days' : 'Months'}
        yLabel="Sales"
      />
    )
  }
  return <Typography>No data available</Typography>
}
