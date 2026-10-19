import React, { useEffect, useState } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup
} from 'react-simple-maps'
import { geoCentroid } from 'd3-geo'
import { Button } from '@mui/material'

const INDIA_STATES_URL = '/geojson/india.geojson'
const DISTRICT_FOLDER_URL = '/geojson/states/'

// ✅ Manual centers for better marker placement
const stateCenters = {
  'Andhra Pradesh': [79.74, 15.9129],
  'Arunachal Pradesh': [94.7278, 28.218],
  Assam: [92.9376, 26.2006],
  Bihar: [85.3131, 25.0961],
  Chhattisgarh: [81.8661, 21.2787],
  Goa: [74.124, 15.2993],
  Gujarat: [71.1924, 22.2587],
  Haryana: [76.0856, 29.0588],
  'Himachal Pradesh': [77.1734, 31.1048],
  Jharkhand: [85.2799, 23.6102],
  Karnataka: [75.7139, 15.3173],
  Kerala: [76.2711, 10.8505],
  'Madhya Pradesh': [78.6569, 22.9734],
  Maharashtra: [75.7139, 19.7515],
  Manipur: [93.9063, 24.6637],
  Meghalaya: [91.3662, 25.467],
  Mizoram: [92.9376, 23.1645],
  Nagaland: [94.5624, 26.1584],
  Odisha: [85.0985, 20.9517],
  Punjab: [75.3412, 31.1471],
  Rajasthan: [74.2179, 27.0238],
  Sikkim: [88.5122, 27.533],
  'Tamil Nadu': [78.6569, 11.1271],
  Telangana: [79.0193, 18.1124],
  Tripura: [91.9882, 23.9408],
  'Uttar Pradesh': [80.9462, 26.8467],
  Uttarakhand: [79.0193, 30.0668],
  'West Bengal': [87.855, 22.9868],
  'Andaman and Nicobar Islands': [92.6586, 11.7401],
  Chandigarh: [76.7794, 30.7333],
  'Dadra and Nagar Haveli and Daman and Diu': [73.0169, 20.1809],
  Delhi: [77.1025, 28.7041],
  'Jammu and Kashmir': [76.5762, 33.7782],
  Ladakh: [78.2932, 34.2996],
  Lakshadweep: [72.6417, 10.5667],
  Puducherry: [79.8083, 11.9416]
}

const IndiaMap = ({
  stateData = {},
  cityData = {},
  selectedState,
  selectedCity,
  formatQuantity,
  formatAmount,
  metric
}) => {
  const [statesGeo, setStatesGeo] = useState(null)
  const [districtsGeo, setDistrictsGeo] = useState({})
  const [currentState, setCurrentState] = useState(null)
  const [center, setCenter] = useState([82.8, 23])
  const [zoomLevel, setZoomLevel] = useState(1)

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

  // ✅ Load India states
  useEffect(() => {
    fetch(INDIA_STATES_URL)
      .then((res) => res.json())
      .then((data) => setStatesGeo(data))
      .catch((err) => console.error('States load error:', err))
  }, [])

  // ✅ Load districts
  const loadDistricts = (stateName) => {
    if (!stateName || districtsGeo[stateName]) return
    const fileName = stateName.toLowerCase().replace(/ /g, '-') + '.geojson'
    fetch(DISTRICT_FOLDER_URL + fileName)
      .then((res) => res.json())
      .then((data) =>
        setDistrictsGeo((prev) => ({ ...prev, [stateName]: data }))
      )
      .catch((err) =>
        console.error(`Districts load error for ${stateName}`, err)
      )
  }

  // ✅ Handle state click
  const handleStateClick = (stateName, centroid) => {
    setCurrentState(stateName)
    loadDistricts(stateName)
    setCenter(centroid)
    setZoomLevel(4)
  }

  // ✅ Reset map
  const resetView = () => {
    setCurrentState(null)
    setCenter([82.8, 23])
    setZoomLevel(1)
  }

  // ✅ Watch external props
  useEffect(() => {
    if (selectedState && statesGeo) {
      const geo = statesGeo.features.find(
        (f) =>
          f.properties.st_nm === selectedState ||
          f.properties.ST_NM === selectedState ||
          f.properties.NAME_1 === selectedState
      )
      if (geo) {
        const centroid = stateCenters[selectedState] || geoCentroid(geo)
        handleStateClick(selectedState, centroid)
      }
    } else if (!selectedState) {
      resetView()
    }
  }, [selectedState, statesGeo])

  useEffect(() => {
    if (selectedCity && currentState && districtsGeo[currentState]) {
      const geo = districtsGeo[currentState].features.find(
        (f) =>
          f.properties.district === selectedCity ||
          f.properties.NAME_2 === selectedCity
      )
      if (geo) {
        const centroid = geoCentroid(geo)
        setCenter(centroid)
      }
    }
  }, [selectedCity, currentState, districtsGeo])

  if (!statesGeo) return <div>Loading India map...</div>

  return (
    <div style={{ position: 'relative', height: 468 }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 1200 }}
        width={900}
        height={900}
      >
        <ZoomableGroup center={center} zoom={zoomLevel}>
          {/* State Layer */}
          {!currentState && (
            <Geographies geography={statesGeo}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const rawName =
                    geo.properties.st_nm ||
                    geo.properties.ST_NM ||
                    geo.properties.NAME_1 ||
                    'Unknown'

                  const stateName = rawName.trim()
                  const centroid = stateCenters[stateName] || geoCentroid(geo)

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => handleStateClick(stateName, centroid)}
                      style={{
                        default: {
                          fill: '#eee',
                          outline: 'none',
                          stroke: '#333',
                          strokeWidth: 0.6
                        },
                        hover: { fill: '#f4a261', outline: 'none' },
                        pressed: { fill: '#e76f51', outline: 'none' }
                      }}
                    />
                  )
                })
              }
            </Geographies>
          )}

          {/* State Markers */}
          {!currentState && (
            <g>
              {Object.entries(stateData).map(([stateName, { value }]) => {
                if (!value) return null
                const geo = statesGeo.features.find(
                  (f) =>
                    f.properties.st_nm === stateName ||
                    f.properties.ST_NM === stateName ||
                    f.properties.NAME_1 === stateName
                )
                if (!geo) return null
                const centroid = stateCenters[stateName] || geoCentroid(geo)

                return (
                  <Marker key={stateName} coordinates={centroid}>
                    <text
                      textAnchor="middle"
                      style={{ fontFamily: 'sans-serif', fill: '#111' }}
                    >
                      <tspan x="0" dy="0" fontSize={12} fontWeight="bold">
                        {stateName}
                      </tspan>
                      <tspan x="0" dy="14" fontSize={12}>
                        {valueFormatter(value)}
                      </tspan>
                    </text>
                  </Marker>
                )
              })}
            </g>
          )}

          {/* District Layer */}
          {currentState && districtsGeo[currentState] && (
            <Geographies geography={districtsGeo[currentState]}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const districtName =
                    geo.properties.district || geo.properties.NAME_2
                  const centroid = geoCentroid(geo)
                  const districtValue = cityData[districtName]?.value

                  return (
                    <React.Fragment key={geo.rsmKey}>
                      <Geography
                        geography={geo}
                        style={{
                          default: {
                            fill: '#cde',
                            outline: 'none',
                            stroke: '#555',
                            strokeWidth: 0.5
                          },
                          hover: { fill: '#2a9d8f', outline: 'none' },
                          pressed: { fill: '#264653', outline: 'none' }
                        }}
                      />
                      {districtValue && (
                        <Marker coordinates={centroid}>
                          <text
                            textAnchor="middle"
                            style={{ fontFamily: 'sans-serif', fill: '#111' }}
                          >
                            <tspan x="0" dy="0" fontSize={3} fontWeight="bold">
                              {districtName}
                            </tspan>
                            <tspan x="0" dy="5" fontSize={5}>
                              {valueFormatter(districtValue)}
                            </tspan>
                          </text>
                        </Marker>
                      )}
                    </React.Fragment>
                  )
                })
              }
            </Geographies>
          )}
        </ZoomableGroup>
      </ComposableMap>

      {/* Reset Button */}
      <div style={{ position: 'absolute', top: 10, left: 10 }}>
        {currentState && (
          <Button
            variant="contained"
            size="small"
            color="success"
            onClick={resetView}
            sx={{
              fontSize: '0.75rem',
              minWidth: '100px',
              padding: '4px 8px',
              backgroundColor: '#f44336', // red background
              color: '#fff', // text white
              '&:hover': {
                backgroundColor: '#d32f2f' // darker red on hover
              }
            }}
          >
            Reset View
          </Button>
        )}
      </div>
    </div>
  )
}

export default IndiaMap
