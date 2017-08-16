'use strict'

var Consumer = require('../src/index').Consumer
var config = require('./config')

var consumer = new Consumer(config)
consumer.connect(() => {
  for (let i = 0; i < 2; i++) {
    consumer.RPC['yggdrasil-dev'].test(i).then((data) => {
      // console.info(data)
    })
  }
})
