<template>
  <div class="dynamic-map">
    <h1 class="label-date">{{labelDate}}</h1>
  </div>
</template>

<script>
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import Papa from 'papaparse'
import {addDays, format} from 'date-fns'

// eslint-disable-next-line
import Worker from 'worker-loader!../map.worker'

import {width, height, tRange, bbox} from '../meta.json'

const T1 = new Date(2013, 0, 1)

mapboxgl.accessToken = 'pk.eyJ1IjoiY2hhY2hvcGF6b3MiLCJhIjoiY2pkMDN3eW4wNHkwZDJ5bGc0cnpueGNxbCJ9.WWWg_OnK5e7L1RknMliY4A'

export default {
  props: ['progress'],
  data () {
    return {
      labelDate: ''
    }
  },
  methods: {
    addHotspotsLayer (map) {
      const $canvas = document.createElement('canvas')
      $canvas.width = width
      $canvas.height = height
      const ctx = $canvas.getContext('2d')
      const imageData = ctx.createImageData(width, height)

      let cursor
      let cursorMoving = false
      let pendingCursorMove = null

      const worker = new Worker()
      worker.onmessage = e => {
        const [type, payload] = e.data
        if (type === 'cursor initialized') {
          cursor = payload
          this.$watch('progress', p => {
            const t = Math.floor((1 - p) * tRange[0] + p * tRange[1])
            moveCursor(t)
          }, {immediate: true})
        } else if (type === 'cursor moved') {
          cursorMoving = false
          Object.assign(cursor, payload)
          imageData.data.set(payload.image, 0)
          ctx.putImageData(imageData, 0, 0)
          const date = addDays(T1, cursor.index - 1)
          this.labelDate = format(date, 'dd MMM yyyy')
          if (pendingCursorMove != null) moveCursor(pendingCursorMove)
        }
      }

      function moveCursor (t) {
        pendingCursorMove = null
        if (cursorMoving) {
          pendingCursorMove = t
        } else {
          cursorMoving = true
          worker.postMessage(['move cursor', {cursor, to: t}])
        }
      }

      map.addSource('hotspots', {
        type: 'canvas',
        canvas: $canvas,
        coordinates: [
          [bbox[0], bbox[3]],
          [bbox[2], bbox[3]],
          [bbox[2], bbox[1]],
          [bbox[0], bbox[1]]
        ]
      })

      map.addLayer({
        id: 'hotspots_layer',
        type: 'raster',
        source: 'hotspots'
      })
    },
    addWindLayer (map) {
      Papa.parse('./wind.csv', {
        download: true,
        dynamicTyping: true,
        complete: results => {
          const {data} = results
          const geojson = {
            type: 'FeatureCollection',
            features: []
          }

          const T = data[data.length - 1][2]
          const size = data.length / T

          for (let id = 0; id < size; id++) {
            const [x, y] = data[id]
            const feature = {
              id,
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [x, y]
              },
              properties: {}
            }
            for (let t = 1; t <= T; t++) {
              const index = (t - 1) * size + id
              const scale = data[index][3] * 8 + 8
              const bearing = data[index][4] * 30
              feature.properties['S' + t] = scale
              feature.properties['B' + t] = bearing
            }
            geojson.features.push(feature)
          }

          map.addSource('wind', {
            type: 'geojson',
            data: geojson
          })

          map.addLayer({
            id: 'wind_layer',
            type: 'symbol',
            source: 'wind',
            layout: {
              'text-field': '↑',
              'text-allow-overlap': true
            },
            paint: {
              'text-color': 'white'
            }
          })

          this.$watch('progress', p => {
            const t = Math.floor((1 - p) * tRange[0] + p * tRange[1])
            map.setFilter('wind_layer', ['has', 'S' + t])
            map.setLayoutProperty('wind_layer', 'text-size', ['get', 'S' + t])
            map.setLayoutProperty('wind_layer', 'text-rotate', ['get', 'B' + t])
          }, {immediate: true})
        }
      })
    }
  },
  mounted () {
    const map = new mapboxgl.Map({
      container: this.$el,
      style: 'mapbox://styles/mapbox/dark-v9',
      center: [
        (bbox[0] + bbox[2]) / 2,
        (bbox[1] + bbox[3]) / 2
      ],
      minZoom: 0,
      maxZoom: 10,
      zoom: 4,
      interactive: false
    })

    map.on('load', () => {
      this.addHotspotsLayer(map)
      this.addWindLayer(map)
    })
  }
}
</script>

<style lang="scss">
.dynamic-map {
  width: 100%;
  height: 100%;

  .map-container {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
  }

  .label-date {
    position: absolute;
    right: 0;
    z-index: 1;
    padding: 20px;
    margin: 0;
    font-size: 32px;
    line-height: 1.2;
    color: white;
  }
}
</style>
