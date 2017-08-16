'use strict'

const net = require('net')
const Command = require('./utils/command')
const utils = require('./utils/utils')
const jsonrpc = require('jsonrpc-lite')
const EventEmitter = require('events').EventEmitter
const ExBuffer = require('./utils/exBuffer')
const Promise = require('bluebird')
const Register = require('./../src/register/register')
const register = require('./register/zookeeperRegister')
const Logger = require('./logger/logger')

class Consumer extends EventEmitter {

  constructor(config, logger) {
    super()

    this.config = config
    this.logger = logger || new Logger().getLogger()
    this.register = new register(config)
    // this.commandCallback = Object.create(null)
    this.RPC = Object.create(null)
    this.connectionObject = Object.create(null)
  }

  connect(callback) {
    if (this.register instanceof Register) {
      this.register.subscribe(this.createServer, this)
      this.on('createConnection', (data) => {
        callback.apply(this)
      })
    } else {
      throw new Error('register Object is not implements Register')
    }
  }

  connectServer(hosts) {
    hosts.forEach((host) => {
      this.connection = net.createConnection(host.port, host.ip)
      this.connection.setTimeout(0)
      this.connection.setNoDelay(true)
      this.connection.setKeepAlive(true)
      this.connection.on('connect', () => {
        const descObject = jsonrpc.request('init-rpc', 'getProviderMethodsDesc', {})
        utils.packet(JSON.stringify(descObject), this.connection)
        this.logger.info('Consumer has been connected!')
      })
      this.connection.on('error', (err) => {
        this.logger.error('CONNECTION_DAMN_ERROR', err)
      })
      this.connection.on('timeout', () => {
        this.logger.error('Consumer connection timeout')
      })
      this.connection.on('end', () => {
        this.logger.error('Consumer connection has end.')
      })
      this.connection.on('close', () => {
        this.logger.error('Consumer connection has close.')
      })
      var exBuffer = new ExBuffer()
      this.connection.on('data', (data) => {
        exBuffer.put(data)
      })
      exBuffer.on('data', (buffer) => {
        this.resHandler(buffer.toString())
      })
    })
  }

  resHandler(data) {
    let message = jsonrpc.parse(data)
    switch (message.type) {
      case 'success':
        if (message.payload.id !== 'init-rpc') {
          if(this.config.logger.level === 'debug'){
             this.logger.info(message.payload.toString())
          }
          this.emit(message.payload.id, message.payload.result)
        } else {
          if (message.payload.result && message.payload.result.methods) {
            this.RPC[message.payload.result.provider] = {}
            message.payload.result.methods.forEach((name) => {
              this.RPC[message.payload.result.provider][name] = this.sendToProvider(name)
              this.emit('createConnection', message.payload.result)
            })
          }
        }
        break
      case 'error':
        this.emit(message.payload.id, message.payload.error)
        break
      case 'invalid':
        break
      default:
    }
  }

  sendToProvider(name) {
    const _me = this
      // the params is ' traceid,...args '
    return function() {
      return new Promise((resolve, reject) => {
        let message = new Command(name, arguments)
        utils.packet(message.data, _me.connection)
        _me.once(message.id, (data) => {
          return resolve(data)
        })
      })
    }
  }

  createServer(data) {
    // prase hosts
    const hosts = data.data
    const urls = []
    for (let i = 0; i < hosts.length; i++) {
      const values = hosts[i].split(':')
      if (values[1] && values[0] !== 'undefined' && values[1] !== 'undefined') {
        urls.push({
          ip: values[0],
          port: parseInt(values[1])
        })
      } else {
        this.logger.error('provider address has error:' + hosts[i])
      }
    }
    const hostArray = urls.filter((host) => {
        return !this.connectionObject[host.ip + ':' + host.port]
      })
      // 比较当前存在链接的地址列表，去除已经停掉的服务
      // 存在的链接地址
    const keys = Object.keys(this.connectionObject)
    keys.forEach((key) => {
        // 从获取的新的地址列表中，判断存在的地址是否在获取的新的地址列表中
        let keyHost = urls.find((host) => {
            return key == host.ip + ':' + host.port
          })
          // 在最新的地址中不存在，则表示呗关闭了，需要剔除该链接
        if (!keyHost) {
          delete this.connectionObject[key]
        }
      })
      // 最新的connections 链接数组
    this.connections = []
    Object.keys(this.connectionObject).forEach((host) => {
      this.connections.push(this.connectionObject[host.ip + ':' + host.port])
    })
    this.connectServer(hostArray)
  }

}

module.exports = Consumer