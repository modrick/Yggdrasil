'use strict'
const Consumer = require('../src/index').Consumer
const config = require('./config')
const ilog = require('ilog')
const co = require('co')

const consumer = new Consumer(config)
consumer.connect(() => {
  co(function * () {
    ilog.info('bench start..')
    let total = 500000 * 3
    let count = total
    let finish = 0
    let queue = []
    let cocurrency = 1000
    let time = Date.now()
    while (count--) {
      queue.push(consumer.RPC['yggdrasil-dev'].test(count).then((data) => {
        if (!(finish++ % 10000)) process.stdout.write('.')
      }))
      if (queue.length >= cocurrency) yield queue.shift()
    }
    // wait for all request.
    yield queue
    time = Date.now() - time
    ilog('\nFinished,', cocurrency + ' cocurrency,', time + ' ms,', (total / (time / 1000)).toFixed(2) + ' ops')
  }).catch((err) => {
    console.info(err)
  })
})
