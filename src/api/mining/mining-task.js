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

  //
  #id
  #sub
  //
  #timestampInitialized
  #timestampCommitted
  #timestampSubmitted
  #timestampResubmitted
  #timestampProceeded
  #timestampConfirmed
  //
  #work

  constructor({id, sub, timestampInitialized, timestampCommited, timestampSubmitted, timestampResubmitted, timestampProceeded, timestampConfirmed, work}, storage) {
    // Durable Object Storage
    this.#Storage = storage
    // Generated identity in initialize()
    this.#id = id
    // Miner information
    this.#sub = sub
    // Timestamps and states
    this.#timestampInitialized = timestampInitialized // Initialized timestamp
    this.#timestampCommitted = timestampCommited // Committed timestamp, the actual timestamp of the committed work
    this.#timestampSubmitted = timestampSubmitted // Submitted timestamp
    this.#timestampResubmitted = timestampResubmitted // Resubmitted timestamp
    this.#timestampProceeded = timestampProceeded // Proceeded timestamp
    this.#timestampConfirmed = timestampConfirmed // Confirmed timestamp
    // Information for Proceeding
    this.#work = work // Work details, e.g. (SPoW) Social Proof of Work
  }

  // Object clone
  clone() {
    return {
      id: this.#id,
      sub: this.#sub,
      timestampInitialized: this.#timestampInitialized,
      timestampCommitted: this.#timestampCommitted,
      timestampSubmitted: this.#timestampSubmitted,
      timestampResubmitted: this.#timestampResubmitted,
      timestampProceeded: this.#timestampProceeded,
      timestampConfirmed: this.#timestampConfirmed,
      work: this.#work
    }
  }

  // ==========================================================================
  // Read / Write

  // Save current cloned object in Durable Object
  async save() {
    if (!this.#Storage) {
      return
    }

    // Only available when connected to Durable Object
    
    // DEPRECATED
    // const self = JSON.parse(JSON.stringify(this))

    await this.#Storage.put(Mining.MINING_TASK, this.clone())
  }

  // Delete the cloned object saved in Durable Object.
  async destroy() {
    if (!this.#Storage) {
      return
    }

    await this.#Storage.delete(Mining.MINING_TASK)
  }

  // ==========================================================================
  // States

  isInitialized() {
    return this.#timestampInitialized !== undefined
  }

  isCommitted() {
    return this.#timestampCommitted !== undefined
  }

  isSubmitted() {
    return this.#timestampSubmitted !== undefined
  }

  isResubmitted() {
    return this.#timestampResubmitted !== undefined
  }

  isProceeded() {
    return this.#timestampProceeded !== undefined
  }

  isConfirmed() {
    return this.#timestampConfirmed !== undefined
  }

  // ==========================================================================
  // User permissions

  async initialize(callback) {
    // Unique Id
    this.#id = await Utils.uniqueId()

    this.#timestampInitialized = Date.now()

    // Custom callback
    callback && await callback.bind(this)()

    // Trigger save operation
    await this.save()
  }

  // CAREFUL: USER_INPUT
  async submit(work) {
    // Prerequisite check
    if (!this.isInitialized()) {
      return false
    }

    let valid = await validateSchema('mining-task-work', work)
    if (valid) {
      this.#work = work
      if (this.isSubmitted()) {
        this.#timestampResubmitted = Date.now()
      } else {
        this.#timestampSubmitted = Date.now()
      }

      // Trigger save operation
      this.save()
      return true
    }
    return false
  }

  // ==========================================================================
  // Admin permissions

  // TODO
  // Verify work and set committed
  async verifyWork() {

  }

  proceed() {
    this.#timestampProceeded = Date.now()
  }

  confirm() {
    this.#timestampConfirmed = Date.now()
  }

}
