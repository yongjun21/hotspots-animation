import Papa from 'papaparse'

import meta from './meta.json'

const WINDOW = 3
const KERNEL = generateKernel(1)

const data = []
let deltas, indexes

Papa.parse('./hotspots.csv', {
  download: true,
  dynamicTyping: true,
  step: res => {
    if (res.error) return console.error(res.error)
    const [x, y, t, h, l] = res.data
    data.push([x, y, t, h, l], [x, y, t + WINDOW, -h, -l])
  },
  complete: () => {
    data.sort((a, b) => a[2] - b[2])

    deltas = new Int16Array(data.length * 5)
    data.forEach((row, i) => {
      row[0] -= meta.xRange[0]
      row[1] -= meta.yRange[0]
      deltas.set(row, i * 5)
    })

    indexes = new Int32Array(meta.tRange[1] + 1)
    let i = 0
    for (let t = 1; t < indexes.length; t++) {
      while (t >= deltas[5 * i + 2]) i++
      indexes[t] = i - 1
    }
    indexes[0] = -1

    const cursor = initCursor(1)
    postMessage(
      ['cursor initialized', cursor],
      [cursor.value.buffer, cursor.image.buffer]
    )
  }
})

onmessage = function (e) {
  const [type, payload] = e.data
  if (type === 'move cursor') {
    const {cursor, to} = payload
    moveCursor(cursor, to)
    postMessage(
      ['cursor moved', cursor],
      [cursor.value.buffer, cursor.image.buffer]
    )
  }
}

function initCursor (at) {
  const cursor = {
    index: 0,
    value: new Uint16Array(meta.width * meta.height * 2),
    image: new Uint8ClampedArray(meta.width * meta.height * 4)
  }
  moveCursor(cursor, at)
  return cursor
}

function moveCursor (cursor, to) {
  const from = cursor.index
  const reverse = to < from
  const reverseSign = reverse ? -1 : 1
  const fromIndex = (indexes[from] + !reverse) * 5
  const toIndex = (indexes[to] + reverse) * 5
  if (reverse) {
    for (let i = fromIndex; i >= toIndex; i -= 5) applyChange(i)
  } else {
    for (let i = fromIndex; i <= toIndex; i += 5) applyChange(i)
  }
  cursor.index = to
  return cursor

  function applyChange (i) {
    for (let j = 0; j < KERNEL.length; j += 3) {
      const k = (deltas[i + 1] + KERNEL[j + 1]) * meta.width + (deltas[i] + KERNEL[j])
      const nextH = cursor.value[2 * k] + reverseSign * deltas[i + 3] * KERNEL[j + 2]
      const nextL = cursor.value[2 * k + 1] + reverseSign * deltas[i + 4] * KERNEL[j + 2]
      if (nextH > 0) {
        cursor.image[k * 4] = 255
        cursor.image[k * 4 + 1] = 0
        cursor.image[k * 4 + 3] = 255
      } else if (nextL > 0) {
        cursor.image[k * 4] = 255
        cursor.image[k * 4 + 1] = 127
        cursor.image[k * 4 + 3] = 255
      } else {
        cursor.image[k * 4] = 0
        cursor.image[k * 4 + 1] = 0
        cursor.image[k * 4 + 3] = 0
      }
      cursor.value[2 * k] = nextH
      cursor.value[2 * k + 1] = nextL
    }
  }
}

function generateKernel (radius) {
  const kernel = []
  for (let offsetY = -radius; offsetY <= radius; offsetY++) {
    for (let offsetX = -radius; offsetX <= radius; offsetX++) {
      if (Math.abs(offsetY) + Math.abs(offsetX) <= radius) {
        kernel.push(offsetX, offsetY, 1)
      }
    }
  }
  return new Int8Array(kernel)
}
