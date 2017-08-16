'use strict'
/**
 * trace filter , it will create a Trace Object 
 *
 * @param {} 
 * @return {}
 */
const redis = require('redis')
const utils = require('./../utils/utils')

class RedisFilter {

  constructor (config) {
    this.host = config.host
    this.port = config.port
    this.auth = config.auth
    this.client = redis.createClient(this.port, this.host, {
      auth_pass: this.auth
    })
  }

  getFilter () {
    return (req, res, next) => {
      // start time
      const startTime = utils.getCurrentTime()
      // trace's id
      req.traceId = utils.idGenerator()
      // ip
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress
      // accept params
      let params = req.query
      if (params && Object.keys(params).length === 0) {
        params = req.body
      }
      const method = req.method.toUpperCase()
      const router = req.route ? req.route.path : '[Unknown]'
      const url = req.path
      let self = this
      let end = res.end
      res.end = function (chunk, encoding) {
        var message
        res.end = end
        res.end(chunk, encoding)
        return process.nextTick(function () {
          self.client.hset('h' + req.traceId, 'router', router)
          self.client.hset('h' + req.traceId, 'url', url)
          self.client.hset('h' + req.traceId, 'params', JSON.stringify(params))
          self.client.hset('h' + req.traceId, 'method', method)
          self.client.hset('h' + req.traceId, 'ip', ip)
          self.client.hset('h' + req.traceId, 'startTime', startTime)
          self.client.hset('h' + req.traceId, 'endTime', utils.getCurrentTime())
          return 'ok'
        })
      }
      return next()
    }
  }

}

module.exports = RedisFilter
