// OBSOLETE

const fs = require('fs')
const netcdf4 = require('netcdf4')
const _range = require('lodash/range')

const {bbox} = require('../data/processed/meta.json')

const T1 = (Date.UTC(2013, 0, 1) - Date.UTC(1800, 0, 1)) / 60 / 60 / 1000

const extracted = _range(2013, 2020).reduce(read, '')
fs.writeFileSync('data/processed/wind.csv', extracted)

function read (agg, year) {
  console.log(year)
  const lines = []
  const uFilename = `data/raw/NCEP_NCAR/uwnd.sig995.${year}.nc`
  const vFilename = `data/raw/NCEP_NCAR/vwnd.sig995.${year}.nc`
  const uReader = new netcdf4.File(uFilename, 'r')
  const vReader = new netcdf4.File(vFilename, 'r')
  const {dimensions, variables} = uReader.root
  variables.vwnd = vReader.root.variables.vwnd
  const X = dimensions.lon.length
  const Y = dimensions.lat.length
  const T = dimensions.time.length
  for (let i = 0; i < X; i++) {
    const x = variables.lon.read(i)
    if (x <= bbox[0] || x >= bbox[2]) continue
    for (let j = 0; j < Y; j++) {
      const y = variables.lat.read(j)
      if (y <= bbox[1] || y >= bbox[3]) continue
      const ks = variables.time.readSlice(0, T)
      const us = variables.uwnd.readSlice(0, T, j, 1, i, 1)
      const vs = variables.vwnd.readSlice(0, T, j, 1, i, 1)
      ks.forEach((k, index) => {
        const t = (k - T1) / 24 + 1
        const u = us[index]
        const v = vs[index]
        const s = Math.sqrt(Math.pow(u, 2) + Math.pow(v, 2))
        const b = (360 + Math.atan2(u, v) / Math.PI * 180) % 360
        lines.push([x, y, t, u, v, s, b].join(','))
      })
    }
  }
  return agg ? agg + '\n' + lines.join('\n') : lines.join('\n')
}
