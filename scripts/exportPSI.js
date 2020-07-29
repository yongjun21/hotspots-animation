const {sheets} = require('@st-graphics/backend/client/googleapis')

const data = require('../data/psi.json')

data.forEach(row => {
  const date = new Date(row.timestamp)
  row.year = date.getFullYear()
  row.month = date.getMonth() + 1
  row.day = date.getDate()
  row.hour = date.getHours()
})

const params = {
  spreadsheetId: '18lcycIrDWLTCIkPDzAJK2GzjjF-7UDeeonYHKjcBbLY',
  range: 'PSI!A1:J',
  valueInputOption: 'USER_ENTERED',
  resource: {fields: ['timestamp', 'year', 'month', 'day', 'hour', 'north', 'south', 'east', 'west', 'central'], data}
}

sheets.spreadsheets.values.upload(params).catch(console.error)
