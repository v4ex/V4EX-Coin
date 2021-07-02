import Mining from '../mining.js'

import validateSchema from '../../utils/validate-schema.js'
import Utils from '../../utils/utils.js'


// Value type
// Stored in Miner Durable Object

/**
 * @typedef MiningTask
 * @type {object}
 * @method isInitialized
 * @method isProceeded
 * @method isConfirmed
 */
export default class MiningTask {
  // Private
  #Storage

  constructor({sub, timestampInitialized, timestampCommited, timestampSubmitted, timestampProceeded, timestampConfirmed, work}, storage) {
    // Generated identity in initialize()
    this.id
    // Durable Object Storage
    this.#Storage = storage
    // Miner information
    this.sub = sub
    // Timestamps and states
    this.timestampInitialized = timestampInitialized // Initialized timestamp
    this.timestampCommited = timestampCommited // Committed timestamp, the actual timestamp of the committed work
    this.timestampSubmitted = timestampSubmitted // Submitted timestamp
    this.timestampProceeded = timestampProceeded // Proceeded timestamp
    this.timestampConfirmed = timestampConfirmed // Confirmed timestamp
    // Information for Proceeding
    this.work = work // Work details, e.g. (SPoW) Social Proof of Work
  }

  // ==========================================================================
  // 

  //
  async save() {
    if (!this.#Storage) {
      return
    }

    // Only available when connected to Durable Object
    const self = JSON.parse(JSON.stringify(this))
    await this.#Storage.put(Mining.MINING_TASK, self)
  }

  //
  async destroy() {
    if (!this.#Storage) {
      return
    }

    await this.#Storage.delete(Mining.MINING_TASK)
  }

  // ==========================================================================
  // States

  isInitialized() {
    return this.timestampInitialized !== undefined
  }

  isCommitted() {
    return this.timestampCommitted !== undefined
  }

  isSubmitted() {
    return this.timestampSubmitted !== undefined
  }

  isProceeded() {
    return this.timestampProceeded !== undefined
  }

  isConfirmed() {
    return this.timestampConfirmed !== undefined
  }

  // ==========================================================================
  // User permissions

  async initialize(callback) {
    // Unique Id
    this.id = await Utils.uniqueId()

    this.timestampInitialized = Date.now()

    // Custom callback
    callback && callback.bind(this)()

    // Trigger save operation
    await this.save()
  }

  // CAREFUL: USER_INPUT
  async submit(work) {
    let valid = await validateSchema('mining-task-work', work)
    if (valid) {
      this.work = work
      this.timestampSubmitted = Date.now()

      // Trigger save operation
      this.save()
      return true
    }
    return false
  }

  // ==========================================================================
  // Admin permissions

  // Verify work and set committed
  async verifyWork() {

  }

  proceed() {
    this.timestampProceeded = Date.now()
  }

  confirm() {
    this.timestampConfirmed = Date.now()
  }

}
