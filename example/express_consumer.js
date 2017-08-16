'use strict'

// 引入Ygg
const ygg = require('../src/index')
const Consumer = ygg.Consumer
const config = require('./config')
var consumer = new Consumer(config)
consumer.connect(() => {
  global.RPC = consumer.RPC
})
const express = require('express')
const app = express()
app.get('/testTrace', function (req, res) {
  // 注入一个追踪号
  RPC['yggdrasil-dev'].getUser(req.traceId, 'xxx', 'yyy').then((data) => {
    res.json(data)
  })
})

app.listen(3000)
