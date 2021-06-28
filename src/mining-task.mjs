import Miner from './miner.mjs'

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
    await this.#Storage.put(Miner.MINING_TASK, self)
  }

  //
  async destroy() {
    if (!this.#Storage) {
      return
    }

    await this.#Storage.delete(Miner.MINING_TASK)
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

  initialize() {
    this.timestampInitialized = Date.now()
  }

  submit(work) {
    this.work = work
    this.timestampSubmitted = Date.now()
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
