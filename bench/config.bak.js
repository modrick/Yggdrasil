/**
 * Config file
 *
 * @param  YGhost: your service host.
 * @param  YGport: your service port.
 * @param  ZKhost: zookeeper's hosts address, it is a array.
 * @param  ZKRoot: zookeeper's root path, default:'/'.
 * @param  ZKReconnectTimeout: zookeeper's reconnect time , default:20000.
 */
module.exports = {
  YGhost: '127.0.0.1',
  YGport: '8111',
  ZKhost: ['127.0.0.1:2181'],
  ZKRoot: '/',
  ZKReconnectTimeout: 10000,
  ZKService: 'yggdrasil-dev',
  logger: {
    level: 'info'
  }
}
