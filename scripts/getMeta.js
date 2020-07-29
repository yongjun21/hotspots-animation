const fs = require('fs')

const Z = 13
const PADDING = 10

const csv = fs.readFileSync('data/processed/binned.csv', 'utf-8')
const data = csv.split('\n').map(line => line.split(',').map(Number))

const xRange = getRange(data, 0, PADDING)
const yRange = getRange(data, 1, PADDING)
const tRange = getRange(data, 2)

const meta = {
  xRange,
  yRange,
  tRange,
  width: xRange[1] - xRange[0] + 1,
  height: yRange[1] - yRange[0] + 1,
  bbox: [
    ...pixel2lonlat(xRange[0], yRange[1] + 1, Z),
    ...pixel2lonlat(xRange[1] + 1, yRange[0], Z)
  ]
}

fs.writeFileSync('data/processed/meta.json', JSON.stringify(meta, null, 2))

function getRange (rows, prop, padding = 0) {
  let min = Infinity
  let max = -Infinity
  rows.forEach(row => {
    if (row[prop] < min) min = row[prop]
    if (row[prop] > max) max = row[prop]
  })
  return [
    min - padding,
    max + padding
  ]
}

function pixel2lonlat (x, y, z) {
  const n = 2 ** z
  const lon = x / n * 360 - 180
  const lat = toDeg(Math.atan(Math.sinh(Math.PI - y / n * 2 * Math.PI)))
  return [lon, lat]
}

function toDeg (rad) {
  return rad / Math.PI * 180
}
