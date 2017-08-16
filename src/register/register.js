/**
 *  Abstract class , need been Extend.
 */
'use strict'

class Register {

  constructor (config) {
    if (!config.ZKhost) throw new Error('missing "ZKhosts" parameters.')
    if (!config.ZKRoot) throw new Error('missing "ZKRoot" parameters.')
    this.hosts = config.ZKhost
    this.root = config.ZKRoot
    this.reconnectTimeout = config.ZKReconnectTimeout
    this.service = config.ZKService
    this.providerHost = config.YGhost + ':' + config.YGport
  }

  // Abstract methods , need overridde
  publish () {}
  // Abstract methods , need overridde
  subscribe () {}

}
module.exports = Register
