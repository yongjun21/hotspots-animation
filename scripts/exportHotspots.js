const fs = require('fs')
const _addDays = require('date-fns/addDays')
const {sheets} = require('@st-graphics/backend/client/googleapis')

const T1 = new Date(2013, 0, 1)

const data = fs.readFileSync('data/processed/hotspots.csv', 'utf-8')
  .split('\n').map(line => line.split(',').map(Number))

const byDate = {}
data.forEach(row => {
  const [,, t, h, l] = row
  byDate[t] = byDate[t] || {high: 0, low: 0}
  byDate[t].high += h
  byDate[t].low += l
})

const exported = []
Object.entries(byDate).forEach(([t, count]) => {
  const d = _addDays(T1, t - 1)
  exported.push(Object.assign({
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate()
  }, count))
})

const params = {
  spreadsheetId: '18lcycIrDWLTCIkPDzAJK2GzjjF-7UDeeonYHKjcBbLY',
  range: 'Hotspots!A1:E',
  valueInputOption: 'USER_ENTERED',
  resource: {fields: ['year', 'month', 'day', 'high', 'low'], data: exported}
}

sheets.spreadsheets.values.upload(params).catch(console.error)
