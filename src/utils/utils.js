'use strict'

const uuid = require('uuid')

module.exports = {

  idGenerator() {
    return uuid.v1()
  },

  isGenerator(func) {
    return typeof(func === 'f`unction') && (func.constructor.name === 'GeneratorFunction')
  },

  packet(data, socket) {
    const len = Buffer.byteLength(data)
    let headBuf = new Buffer(2)
    headBuf.writeUInt16BE(len, 0)
    socket.write(headBuf)
    let bodyBuf = new Buffer(len)
    bodyBuf.write(data)
    socket.write(bodyBuf)
  },

  getCurrentTime() {
    const time = process.hrtime()
    return time[0] * 1e9 + time[1]
  },

  getDateFormat() {
    const date = new Date()
    return (date.getYear() + 1900) + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds()
  }

}