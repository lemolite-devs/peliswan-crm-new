import React from 'react'
import { BarChart } from '@mui/x-charts/BarChart'

const StateWiseBarChart = ({
  xAxis = [],
  series = [],
  width = 550,
  height = 300,
  margin = { top: 30, bottom: 50, left: 190, right: 30 },
  yAxis = [],
  formatQuantity,
  formatAmount,
  metric,
  ...props
}) => {
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

  return (
    <BarChart
      xAxis={xAxis.map((axis) => ({
        ...axis,
        valueFormatter, // ✅ function pass
        tickLabelStyle: {
          fontSize: 10,
          fontWeight: 500
        }
      }))}
      yAxis={yAxis.map((axis) => ({
        ...axis,
        valueFormatter,
        tickLabelStyle: {
          fontSize: 8,
          fontWeight: 500
        }
      }))}
      series={series.map((s) => ({
        ...s,
        color: s.color,
        highlightScope: { highlighted: 'item', faded: 'global' },
        valueFormatter // ✅ यहाँ भी
      }))}
      slotProps={{
        legend: {
          hidden: true
        }
      }}
      borderRadius={8}
      tooltip={{ trigger: 'item' }}
      grid={{ horizontal: true }}
      width={width}
      height={height}
      margin={margin}
      {...props}
    />
  )
}

export default StateWiseBarChart
