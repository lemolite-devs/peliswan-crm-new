import * as React from 'react'
import { PieChart } from '@mui/x-charts/PieChart'

export default function BasicPieChartMuix({ data }) {
  const colorPerItem = [
    { ...data[0], color: '#F44336' },
    { ...data[1], color: 'rgb(255, 152, 0)' },
    { ...data[2], color: '#2196F3' },
    { ...data[3], color: '#4CAF50' },
    { ...data[4], color: 'rgb(158, 158, 158)' },
    { ...data[5], color: 'rgb(103, 58, 183)' }
  ]
  return (
    <PieChart
      series={[
        {
          data:
            colorPerItem.length !== 0
              ? colorPerItem
              : [
                  { id: 0, value: 10, label: 'Hot' },
                  { id: 1, value: 15, label: 'Warm' },
                  { id: 2, value: 20, label: 'Cold' },
                  { id: 3, value: 10, label: 'Follow-Up' },
                  { id: 4, value: 15, label: 'Irrelevant' },
                  { id: 5, value: 20, label: 'Others' }
                ],
          innerRadius: 0,
          outerRadius: 100,
          paddingAngle: 0,
          cornerRadius: 5,
          startAngle: -45,
          endAngle: 360
        }
      ]}
      width={400}
      height={200}
    />
  )
}
