'use strict'

const Provider = require('../src/index').Provider
const config = require('./config')
let id = 0
const provider = new Provider(config, {
  getUser(userId, x) {
    return {_id: 'xxxx', age: 20, name: 'iamhades', sex: 'm'}
  },
  getBank(userId) {
    return [{_id: 'yyyy', bank: '中信银行'}, {_id: 'zzzz', bank: '招商银行'}]
  }
})
provider.listen()
