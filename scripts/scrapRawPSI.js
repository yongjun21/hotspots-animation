const fs = require('fs')
const axios = require('axios')
const _range = require('lodash/range')
const _sortBy = require('lodash/sortBy')
const _addHours = require('date-fns/addHours')

const {promiseMap} = require('./util')

const existing = require('../data/processed/psi_raw.json')

const T0 = new Date(2019, 0, 1, 8)
const REGIONS = ['north', 'south', 'east', 'west', 'central']
const MEASURES = [
  'pm25_twenty_four_hourly',
  'pm10_twenty_four_hourly',
  'so2_twenty_four_hourly',
  'co_eight_hour_max',
  'o3_eight_hour_max',
  'no2_one_hour_max'
]

const dates = _range(0, 0 * 24).map(i => _addHours(T0, i))

promiseMap(dates, scrapDataGov, {concurrency: 10}).then(jsons => {
  const combined = jsons.reduce((arr, items) => arr.concat(items), existing)
  const sorted = _sortBy(combined, ['timestamp', 'region', 'measure'])
  fs.writeFileSync('data/processed/psi_raw.json', JSON.stringify(sorted, null, 2))
})

function scrapDataGov (date, i) {
  if (i % 100 === 0) console.log(i)
  const url = `https://api.data.gov.sg/v1/environment/psi?date_time=${date.toISOString().slice(0, 19)}`
  return axios.get(url)
    .then(res => res.data)
    .then(parseDataGov)
}

function parseDataGov (json) {
  const records = []
  try {
    const row = json.items[0]
    const timestamp = Date.parse(row.timestamp)
    MEASURES.forEach(measure => {
      const readings = row.readings[measure]
      REGIONS.forEach(region => {
        const value = readings[region]
        records.push({timestamp, region, measure, value})
      })
    })
  } catch (err) {
    console.log(json)
  }
  return records
}
