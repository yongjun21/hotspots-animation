const fs = require('fs')
const _buffer = require('@turf/buffer').default
const _inside = require('@turf/boolean-point-in-polygon').default

const data = require('../data/raw/combined.json')
const geoLimits = getGeoLimits()

const binned = {}

const T1 = new Date(2013, 0, 1)
const DAY = 24 * 60 * 60 * 1000

const filter = row => (row.type == null || row.type === 0) && row.confidence >= 30 && geoLimits.isWithin([row.longitude, row.latitude])

data.forEach((row, i) => {
  if (!filter(row)) return
  const [x, y] = lonlat2xy(row.longitude, row.latitude, 13)
  const t = Math.round((new Date(row.acq_date) - T1) / DAY) + 1
  const key = [x, y, t].join('.')
  binned[key] = binned[key] || [0, 0]
  binned[key][row.confidence >= 80 ? 0 : 1]++
})

const rows = Object.entries(binned)
  .map(([key, value]) => [...key.split('.'), ...value])
  .sort((a, b) => a[2] - b[2])
  .map(row => row.join(','))

fs.writeFileSync('data/processed/binned.csv', rows.join('\n'))

function lonlat2xy (lon, lat, z) {
  let x = toRad(lon)
  let y = Math.asinh(Math.tan(toRad(lat)))

  x = (1 + x / Math.PI) / 2
  y = (1 - y / Math.PI) / 2

  const n = 2 ** z
  x = Math.floor(x * n)
  y = Math.floor(y * n)

  return [x, y]
}

function toRad (deg) {
  return deg / 180 * Math.PI
}

function getGeoLimits () {
  const geojson = require('../data/raw/geojson/countries.json')
  const subset = [
    'Indonesia',
    'Malaysia',
    'Brunei',
    'Singapore'
  ]
  const limits = geojson.features
    .filter(f => subset.includes(f.properties.CNTRY_NAME))
    .map(f => _buffer(f, 10, {units: 'kilometers'}))
  return {
    isWithin: pt => limits.some(f => _inside(pt, f))
  }
}
