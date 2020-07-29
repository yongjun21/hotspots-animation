const fs = require('fs')
const _sortBy = require('lodash/sortBy')

const BEAUFORT_SCALE = [1, 3, 6, 10, 16, 21, 27]

const csv = fs.readFileSync('data/processed/wind_2500ft.csv', 'utf-8')
const data = csv.split('\n').map(line => line.split(',').map(Number)).map(row => {
  const [,,, u, v] = row
  const s = Math.sqrt(Math.pow(u, 2) + Math.pow(v, 2))
  const b = (360 + Math.atan2(u, v) / Math.PI * 180) % 360
  return row.concat(s, b)
})

const simplified = data.map(row => {
  const [x, y, t,,, s, b] = row
  const knots = s * 1.943844
  const scale = BEAUFORT_SCALE.filter(v => v <= knots).length
  const d = 12 - Math.floor((375 - b) / 30) % 12
  return [x, y, t, scale, d]
})

const final = _sortBy(simplified, [2, 1, 0]).map(row => row.join(',')).join('\n')

fs.writeFileSync('data/processed/wind_simplified.csv', final)
