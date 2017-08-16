'use strict'

const net = require('net')
const jsonrpc = require('jsonrpc-lite')
const utils = require('./utils/utils')
const co = require('co')
const ExBuffer = require('./utils/exBuffer')
const Register = require('./../src/register/register')
const register = require('./register/zookeeperRegister')
const Logger = require('./logger/logger')

class Provider {

  constructor(config, methods, logger) {
    this.config = config
    this.logger = logger || new Logger().getLogger()
      // init service's method
    this.methods = {}
    this.register = new register(config, logger)
    if (Array.isArray(methods)) {
      methods.forEach((service) => {
        Object.keys(service).forEach((key) => {
          this.methods[key] = service[key]
        })
      })
    } else {
      this.methods = methods || {}
    }
  }

  listen() {
    const server = net.createServer((connection) => {
      this.connection = connection
      const exBuffer = new ExBuffer()
      connection.on('error', (err) => {
        this.logger.error('CONNECTION_DAMN_ERROR:', err)
      })
      connection.on('timeout', () => {
        this.logger.error('RPC connection timeout')
      })
      connection.on('end', () => {
        this.logger.error("a consumer's connection has end")
      })
      connection.on('close', () => {
        this.logger.error("a consumer's connection has closed")
      })
      connection.on('data', (data) => {
        exBuffer.put(data)
      })
      exBuffer.on('data', (buffer) => {
        utils.packet(this.handler(buffer.toString()), connection)
      })
    })
    if (this.register instanceof Register) {
      this.register.publish(this.config)
      server.listen(this.config.YGport)
    } else {
      throw new Error('register Object is not implements Register')
    }
    this.logger.info('Provider :"' + this.config.YGhost + ':' + this.config.YGport + '" has been start.')
  }

  sendMethods() {
    const methods = []
    Object.keys(this.methods).forEach((key) => {
      methods.push(key)
    })
    return {
      methods: methods,
      provider: this.config.ZKService
    }
  }

  handler(msgObj) {
    let message = jsonrpc.parse(msgObj)
    let response
    switch (message.type) {
      case 'request':
        if (message.payload.method !== 'getProviderMethodsDesc') {
          if (utils.isGenerator(this.methods[message.payload.method])) {
            const self = this
            co(function*() {
              let result = yield self.methods[message.payload.method].apply(null, message.payload.params)
              response = jsonrpc.success(message.payload.id, result)
              if (this.config.logger.level === 'debug') {
                self.logger.info(msgObj, {
                  id: message.payload.id
                })
              }
            }).catch((err) => {
              response = jsonrpc.error(message.payload.id, new jsonrpc.JsonRpcError(err, 500))
              self.logger.error(message.payload.method + '\n' + err)
            })
          } else {
            try {
              let result = this.methods[message.payload.method].apply(null, message.payload.params)
              response = jsonrpc.success(message.payload.id, result)
              if (this.config.logger.level === 'debug') {
                this.logger.info(msgObj, {
                  id: message.payload.id
                })
              }
            } catch (err) {
              response = jsonrpc.error(message.payload.id, new jsonrpc.JsonRpcError(err, 500))
              this.logger.error(message.payload.method + '\n' + err.stack)
            }
          }
        } else {
          response = jsonrpc.success(message.payload.id, this.sendMethods())
        }
        break
      case 'notification':
        break
      case 'success':
        break
      case 'error':
        break
      case 'invalid':
        break
      default:
    }
    return JSON.stringify(response)
  }

}

module.exports = Provider