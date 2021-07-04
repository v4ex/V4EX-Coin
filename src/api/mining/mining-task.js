import Mining from '../mining.js'

import Utilities from '../../utilities/utilities.js'

import SchemasService from '../../services/schemas-service.js'


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

  // Reset the cloned object saved in Durable Object.
  async reset() {
    if (!this.#Storage) {
      return
    }

    await this.#Storage.put(Mining.MINING_TASK, { sub: this.#sub })
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

  // Initialized Mining Task has random id and timestampInitialized.
  async initialize(callback) {
    try {
      // Random Id
      this.#id = await Utilities.randomId()

      this.#timestampInitialized = Date.now()

      // Custom callback
      callback && await callback.bind(this)()

      // Trigger save operation
      await this.save()
    } catch (e) {
      return false
    }

    return true
  }

  // CAREFUL: USER_INPUT
  async submit(work) {
    // Prerequisite check
    if (!this.isInitialized()) {
      return false
    }

    let valid = await SchemasService.validateSchema('mining-task-work', work)
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

  // ==========================================================================
  // Getter

  get sub() {
    return this.#sub
  }

}
