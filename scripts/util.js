const fs = require('fs')
const readline = require('readline')

exports.promiseMap = function (iterable, mapper, options) {
  options = options || {}
  let concurrency = options.concurrency || Infinity

  let index = 0
  const results = []
  const iterator = iterable[Symbol.iterator]()
  const promises = []

  while (concurrency-- > 0) {
    const promise = wrappedMapper()
    if (promise) promises.push(promise)
    else break
  }

  return Promise.all(promises).then(() => results)

  function wrappedMapper () {
    const next = iterator.next()
    if (next.done) return null
    const i = index++
    const mapped = mapper(next.value, i)
    return Promise.resolve(mapped).then(resolved => {
      results[i] = resolved
      return wrappedMapper()
    })
  }
}

exports.readLineByLine = function (...args) {
  const transforms = []
  let state = 'pending'
  let error = null

  const rl = readline.createInterface({
    input: fs.createReadStream(...args)
  })

  rl.on('line', line => {
    for (let t of transforms) {
      const {value, done} = t.input || {value: line, done: false}
      if (done) {
        t.output.value = value
        t.output.done = true
      } else if (t.type === 'filter') {
        t.output.value = value
        t.output.done = !t.fn(value, t.index++)
      } else if (t.type === 'map') {
        t.output.value = t.fn(value, t.index++)
        t.output.done = false
      } else if (t.type === 'reduce') {
        if (t.index === 0 && t.output === undefined) t.output = value
        else t.output = t.fn(t.output, value, t.index++)
      }
    }
  })

  rl.on('close', () => {
    transforms.forEach(t => {
      if (t.type === 'reduce') t.resolve(t.output)
    })
    state = 'fulfilled'
  })

  rl.on('error', err => {
    transforms.forEach(t => {
      if (t.type === 'reduce') t.reject(err)
    })
    state = 'rejected'
    error = err
  })

  function createPromise (context) {
    const p = {}

    const methods = ['filter', 'map']
    methods.forEach(method => {
      p[method] = fn => {
        const output = {}
        transforms.push({
          type: method,
          fn,
          index: 0,
          input: context,
          output
        })
        return createPromise(output)
      }
    })

    p.reduce = (fn, init) => {
      if (state === 'fulfilled') return Promise.resolve()
      if (state === 'rejected') return Promise.reject(error)
      return new Promise((resolve, reject) => {
        transforms.push({
          type: 'reduce',
          fn,
          index: 0,
          input: context,
          output: init,
          resolve,
          reject
        })
      })
    }

    p.then = (...args) => {
      return p.reduce((a, v) => {
        a.push(v)
        return a
      }, []).then(...args)
    }

    p.forEach = fn => {
      return p.map((a, v, i) => {
        fn(v, i)
        return undefined
      }, undefined)
    }

    p.some = fn => p.reduce((a, v, i) => a || fn(v, i), false)
    p.every = fn => p.reduce((a, v, i) => a && !fn(v, i), true)

    p.find = fn => {
      let found = false
      return p.reduce((a, v, i) => {
        if (found) return a
        if (fn(v, i)) {
          found = true
          return v
        }
        return a
      }, undefined)
    }

    p.findIndex = fn => (
      p.reduce((a, v, i) => (a < 0 && fn(v, i)) ? i : a, -1)
    )
    p.findLastIndex = fn => (
      p.reduce((a, v, i) => fn(v, i) ? i : a, -1)
    )

    p.slice = (start, end) => (
      p.filter((v, i) => (start == null || i >= start) && (end == null || i < end))
    )

    p.includes = value => p.some(v => v === value)
    p.indexOf = value => p.findIndex(v => v === value)
    p.lastIndexOf = value => p.findLastIndex(v => v === value)

    return p
  }

  return createPromise()
}
