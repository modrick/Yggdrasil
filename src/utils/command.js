/*
 * The consumer sends the message body
 */

'use strict'

const jsonrpc = require('jsonrpc-lite')
const utils = require('./utils')

class Command {
  constructor(method, params) {
    this.id = utils.idGenerator()
    let keys = Object.keys(params)
    let p = []
    let traceid = ''
    for (let i = 0; i < keys.length; i++) {
      p.push(params[i.toString()])
    }
    const msgObj = jsonrpc.request(this.id, method, p)
    msgObj.traceId = params['0']
    this.data = JSON.stringify(msgObj)
  }
}

module.exports = Command