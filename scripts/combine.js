const fs = require('fs')
const Papa = require('papaparse')
const _range = require('lodash/range')

let combined = []

const countries = [
  'indonesia',
  'malaysia',
  'brunei'
]

countries.forEach((country, i) => {
  let csv = fs.readFileSync(`data/raw/MODIS_Archive/${country}.csv`, 'utf-8')
  const rows = Papa.parse(csv, {header: true, dynamicTyping: true}).data
  combined = combined.concat(rows)
})

_range(213, 260).forEach(i => {
  let csv = fs.readFileSync(`data/raw/MODIS_NRT/MODIS_C6_SouthEast_Asia_MCD14DL_NRT_2019${i}.txt`, 'utf-8')
  const rows = Papa.parse(csv, {header: true, dynamicTyping: true}).data
  combined = combined.concat(rows)
})

fs.writeFileSync('data/raw/combined.json', JSON.stringify(combined, null, 2))
