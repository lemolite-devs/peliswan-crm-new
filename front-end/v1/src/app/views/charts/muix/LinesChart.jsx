import React from 'react'
import { LineChart } from '@mui/x-charts/LineChart'

const LinesChart = ({
  xAxis = [],
  series = [],
  width = 650,
  height = 400,
  margin = { top: 30, bottom: 50, left: 60, right: 20 },
  yAxis = [],
  ...props
}) => {
  return (
    <LineChart
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

export default LinesChart
