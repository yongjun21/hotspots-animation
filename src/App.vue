<template>
  <div id="app">
    <st-scrolly>
      <template v-slot:background="{progress}">
        <dynamic-map  :progress="progress(true)"></dynamic-map>
      </template>
    </st-scrolly>
  </div>
</template>

<script>
import '@st-graphics/scrolly/dist/bundle.css'
import StScrolly from '@st-graphics/scrolly'
import DynamicMap from './components/DynamicMap'

export default {
  name: 'app',
  components: {
    StScrolly,
    DynamicMap
  }
}
</script>

<style lang="scss">
html,
body {
  margin: 0;
  padding: 0;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100vh;

  .slide {
    height: 12000px;
  }
}
</style>
