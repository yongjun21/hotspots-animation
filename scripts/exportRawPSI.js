const fs = require('fs')
const Papa = require('papaparse')

const data = require('../data/processed/psi_raw.json')

const csv = Papa.unparse(data)
fs.writeFileSync('data/processed/psi_raw.csv', csv)
