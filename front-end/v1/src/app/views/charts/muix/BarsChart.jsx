import React from 'react'
import { BarChart } from '@mui/x-charts/BarChart'

const BarsChart = ({
  xAxis = [],
  series = [],
  width = 320,
  height = 800,
  margin = { top: 30, bottom: 50, left: 60, right: 20 },
  yAxis = [],
  ...props
}) => {
  return (
    <BarChart
      xAxis={xAxis}
      yAxis={yAxis}
      series={series}
      width={width}
      height={height}
      margin={margin}
      {...props}
    />
  )
}

export default BarsChart
