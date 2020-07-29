const fs = require('fs')
const axios = require('axios')
const _range = require('lodash/range')
const _addDays = require('date-fns/addDays')

const {promiseMap} = require('./util')

const existing = require('../data/processed/psi.json')

const T0 = new Date(2013, 0, 1)
const dates = _range(0, 0).map(i => _addDays(T0, i))

promiseMap(dates, scrapHaze, {concurrency: 10}).then(jsons => {
  const combined = jsons.reduce((arr, items) => arr.concat(items), existing)
  combined.sort((a, b) => a.timestamp - b.timestamp)
  fs.writeFileSync('data/processed/psi.json', JSON.stringify(combined, null, 2))
})

function scrapHaze (date, i) {
  if (i % 10 === 0) console.log(i)
  const d = date.getDate()
  const m = date.getMonth() + 1
  const y = date.getFullYear()
  const url = `https://www.haze.gov.sg/resources/historical-readings/GetData/${d}/${m}/${y}/${Date.now()}`

  return axios.get(url)
    .then(res => res.data)
    .then(parseHaze)
}

function parseHaze (json) {
  return json.AirQualityList.map(row => ({
    timestamp: +row.Date.match(/\((\d+)\)/)[1],
    north: +row.MaxReading.North,
    south: +row.MaxReading.South,
    east: +row.MaxReading.East,
    west: +row.MaxReading.West,
    central: +row.MaxReading.Central
  }))
}
