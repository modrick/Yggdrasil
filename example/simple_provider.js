'use strict'

const Provider = require('../src/index').Provider
const config = require('./config')
let id = 0
const provider = new Provider(config, {
  test() {
    ++id
    return id
  }
})
provider.listen()
