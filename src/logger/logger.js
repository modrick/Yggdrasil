'use strict'

const utils = require('../utils/utils')

class Logger {

  constructor(config) {
    this.logger = {
      error: function(msg) {
        console.error(msg)
      },
      info: function(msg) {
        console.info(msg)
      },
      debug: function(msg) {
        console.warn(msg)
      }
    }
  }

  getLogger() {
    return this.logger
  }
}

module.exports = Logger