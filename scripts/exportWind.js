const fs = require('fs')
const {sheets} = require('@st-graphics/backend/client/googleapis')

const csv = fs.readFileSync('data/processed/wind.csv', 'utf-8')
const data = csv.split('\n').map(line => line.split(',').map(Number))
data.unshift(['x', 'y', 't', 'u', 'v', 's', 'b'])

const params = {
  spreadsheetId: '1Ndvo6kULoqCW8V09hoSBL22iCjblss6Ta5G2M_0B8Wc',
  range: 'Data!A1:G',
  valueInputOption: 'USER_ENTERED',
  resource: {values: data}
}

sheets.spreadsheets.values.upload(params).catch(console.error)
