/**
 *  Register base on Zookeepr, it must extend Register.
 */
'use strict'
const Register = require('./register')
const ZookeeperWatcher = require('zookeeper-watcher')
const co = require('co')
const Promise = require('bluebird')
const Logger = require('../logger/logger')

class ZookeeperRegister extends Register {

	constructor(config, logger) {
		super(config)
		this.logger = logger || new Logger(config).getLogger()
		this.zk = new ZookeeperWatcher({
			hosts: this.hosts,
			root: this.root,
			reconnectTimeout: this.reconnectTimeout
		})
	}

	// publish impl
	// override
	publish() {
		co(function*() {
			yield this.zkConnect()
			let zkState = yield this.nodeGetChildren('/' + this.service)
				// NO_NODE
			if (zkState.type === 0) {
				yield this.nodeCreateRootNode('/' + this.service)
			}
			yield this.nodeCreateTemporaryNode('/' + this.service + '/' + this.providerHost)
			yield this.nodeSetData('/' + this.service)
			this.logger.info('the path :"/' + this.service + '/' + this.providerHost + '" has been created.')
		}.bind(this)).catch((err) => {
			this.logger.error(err.stack)
		})
	}

	// subscribe impl
	// override
	subscribe(todo, env) {
		co(function*() {
			yield this.zkConnect()
				// listener and callback
			yield this.nodeWatch('/' + this.service, this.nodeGetChildren, todo, env)
		}.bind(this)).catch((err) => {
			this.logger.error(err.stack)
		})
	}

	// zookeeper connect..
	zkConnect() {
		return new Promise((resolve, reject) => {
			this.zk.once('connected', (error) => {
				if (error) {
					reject(error)
				} else {
					resolve('ok')
				}
			})
		})
	}

	nodeGetChildren(url) {
		return new Promise((resolve, reject) => {
			this.zk.getChildren(url, null, (error, children, stats) => {
				if (error) {
					if (error.name === 'NO_NODE') {
						resolve({
							type: 0,
							data: error
						})
					} else {
						reject(error)
					}
				} else {
					resolve({
						type: 1,
						data: children
					})
				}
			})
		})
	}

	nodeCreateRootNode(url) {
		return new Promise((resolve, reject) => {
			this.zk.create(url, (error, path) => {
				if (error) reject(error)
				else {
					resolve(path)
				}
			})
		})
	}

	nodeCreateTemporaryNode(url) {
		return new Promise((resolve, reject) => {
			// create a temporary node
			this.zk.create(url, null, 1, (error, path) => {
				if (error) {
					if (error.name === 'NODE_EXISTS') {
						this.logger.info('Path "' + url + '" exists. ')
						resolve({
							type: 0,
							data: path
						})
					} else {
						reject(error)
					}
				} else {
					this.logger.info('Path "' + url + '" create. ')
					resolve({
						type: 1,
						data: path
					})
				}
			})
		})
	}

	nodeSetData(url) {
		return new Promise((resolve, reject) => {
			// create a temporary node
			this.zk.setData(url, new Buffer(new Date().getTime().toString()), -1, (error, stat) => {
				if (error) reject(error)
				else {
					resolve(stat)
				}
			})
		})
	}

	nodeWatch(url, callback, filter, env) {
		return new Promise((resolve, reject) => {
			this.zk.watch(url, (error, value, state) => {
				if (error) reject(error)
				else {
					co(function*() {
						let data = yield callback.apply(this, [url])
						filter.apply(env, [data])
						this.logger.info(data)
						resolve(data)
					}.bind(this)).catch((err) => {
						this.logger.error(err.stack)
					})
				}
			})
		})
	}

}
module.exports = ZookeeperRegister