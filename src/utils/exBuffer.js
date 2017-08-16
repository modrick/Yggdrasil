/*
 * tcp packet of sticky， thx .
 * https://www.npmjs.com/package/ExBuffer
 */
'use strict'

const EventEmitter = require('events').EventEmitter

class ExBuffer extends EventEmitter {
  constructor () {
    super()
    this._headLen = 2
    this._endian = 'B'
    this._bufferLength = ''
    this._buffer = new Buffer(this._bufferLength || 512) // Buffer大于8kb 会使用slowBuffer，效率低
    this._readOffset = 0
    this._putOffset = 0
    this._dlen = 0
  }

  /*
   * 指定包长是uint32型(默认是ushort型)
   */
  uint32Head () {
    this._headLen = 4
    return this
  }

  /*
   * 指定包长是ushort型(默认是ushort型)
   */
  ushortHead () {
    this._headLen = 2
    return this
  }

  /*
   * 指定字节序 为Little Endian (默认：Big Endian)
   */
  littleEndian () {
    this._endian = 'L'
    return this
  }

  /*
   * 指定字节序 为Big Endian (默认：Big Endian)
   */
  bigEndian () {
    this._endian = 'B'
    return this
  }

  /*
   * set the Buffer data
   */
  put (buffer, offset, len) {
    if (offset === undefined) offset = 0
    if (len === undefined) len = buffer.length - offset
    // The current buffer has been unable to meet the number of data
    if (len + this.getLen() > this._buffer.length) {
      var ex = Math.ceil((len + this.getLen()) / (1024)) // 每次扩展1kb
      var tmp = new Buffer(ex * 1024)
      var exlen = tmp.length - this._buffer.length
      this._buffer.copy(tmp)
      if (this._putOffset < this._readOffset) {
        if (this._putOffset <= exlen) {
          tmp.copy(tmp, this._buffer.length, 0, this._putOffset)
          this._putOffset += this._buffer.length
        } else {
          tmp.copy(tmp, this._buffer.length, 0, exlen)
          tmp.copy(tmp, 0, exlen, this._putOffset)
          this._putOffset -= exlen
        }
      }
      this._buffer = tmp
    }
    if (this.getLen() === 0) {
      this._putOffset = this._readOffset = 0
    }
    if ((this._putOffset + len) > this._buffer.length) {
      var len1 = this._buffer.length - this._putOffset
      if (len1 > 0) {
        buffer.copy(this._buffer, this._putOffset, offset, offset + len1)
        offset += len1
      }

      var len2 = len - len1
      buffer.copy(this._buffer, 0, offset, offset + len2)
      this._putOffset = len2
    } else {
      buffer.copy(this._buffer, this._putOffset, offset, offset + len)
      this._putOffset += len
    }
    this.proc()
  }

  proc () {
    let count = 0
    while (true) {
      count++
      if (count > 1000) break // 1000 has not finished
      if (this._dlen === 0) {
        if (this.getLen() < this._headLen) {
          break // can't read header
        }
        if (this._buffer.length - this._readOffset >= this._headLen) {
          this._dlen = this._buffer['readUInt' + (8 * this._headLen) + '' + this._endian + 'E'](this._readOffset)
          this._readOffset += this._headLen
        } else { //
          var hbuf = new Buffer(this._headLen)
          var rlen = 0
          for (var i = 0; i < (this._buffer.length - this._readOffset); i++) {
            hbuf[i] = this._buffer[this._readOffset++]
            rlen++
          }
          this._readOffset = 0
          for (var i = 0; i < (this._headLen - rlen); i++) {
            hbuf[rlen + i] = this._buffer[this._readOffset++]
          }
          this._dlen = hbuf['readUInt' + (8 * this._headLen) + '' + this._endian + 'E'](0)
        }
      }
      if (this.getLen() >= this._dlen) {
        var dbuff = new Buffer(this._dlen)
        if (this._readOffset + this._dlen > this._buffer.length) {
          var len1 = this._buffer.length - this._readOffset
          if (len1 > 0) {
            this._buffer.copy(dbuff, 0, this._readOffset, this._readOffset + len1)
          }

          this._readOffset = 0
          var len2 = this._dlen - len1
          this._buffer.copy(dbuff, len1, this._readOffset, this._readOffset += len2)
        } else {
          this._buffer.copy(dbuff, 0, this._readOffset, this._readOffset += this._dlen)
        }
        try {
          this._dlen = 0
          this.emit('data', dbuff)
          if (this._readOffset === this._putOffset) {
            break
          }
        } catch (e) {
          this.emit('error', e)
        }
      } else {
        break
      }
    }
  }

  // get data's length
  getLen () {
    if (this._putOffset >= this._readOffset) {
      return this._putOffset - this._readOffset
    }
    return this._buffer.length - this._readOffset + this._putOffset
  }

}

module.exports = exports = ExBuffer
