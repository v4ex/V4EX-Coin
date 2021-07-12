import { default as Mining } from './mining-web-socket-server.js'

import Utilities from '../../utilities/utilities.js'

import SchemasService from '../../services/schemas-service.js'
import { Ownable } from '../../models/ownable.js'


// Value type
// Stored in Miner Durable Object

// FIXME Use ownId instead of sub

/**
 * @typedef MiningTask
 * @type {object}
 */
export default class MiningTask extends Ownable {
  // Private
  #storage

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
    super()

    // Durable Object Storage
    this.#storage = storage
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
  get clone() {
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
  // Override

  get ownerId() {
    return this.#sub
  }

  // ==========================================================================
  // Read / Write

  // Save current cloned object in Durable Object
  async save() {
    if (!this.#storage) {
      return
    }

    // Only available when connected to Durable Object
    
    // DEPRECATED
    // const self = JSON.parse(JSON.stringify(this))

    await this.#storage.put(Mining.MINING_TASK, this.clone)
  }

  // Reset the cloned object saved in Durable Object.
  async reset() {
    if (!this.#storage) {
      return
    }

    await this.#storage.put(Mining.MINING_TASK, { sub: this.#sub })
  }

  // ==========================================================================
  // States

  get isInitialized() {
    return this.#timestampInitialized !== undefined
  }

  get isCommitted() {
    return this.#timestampCommitted !== undefined
  }

  get isSubmitted() {
    return this.#timestampSubmitted !== undefined
  }

  get isResubmitted() {
    return this.#timestampResubmitted !== undefined
  }

  get isProceeded() {
    return this.#timestampProceeded !== undefined
  }

  get isConfirmed() {
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
  // CHANGE this.#work
  // CHANGE this.#timestampResubmitted
  // CHANGE this.#timestampSubmitted
  async submit(work) {
    // Prerequisite check
    if (!this.isInitialized) {
      return false
    }

    let valid = await SchemasService.validateSchema('mining-task-work', work)
    if (valid) {
      this.#work = work
      if (this.isSubmitted) {
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
