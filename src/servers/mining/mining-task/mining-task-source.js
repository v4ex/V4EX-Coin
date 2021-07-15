
import _ from '../../../utilities/index.js'

import SchemasService from '../../../services/schemas-service.js'

import { MiningTask } from './models/mining-task.js'

import Source from '../../web-socket/source.js'


// Ownable < Model
// Stored in Miner Durable Object

/**
 * @typedef MiningTask
 * @type {object}
 * 
 * @property {MiningTask} model 
 */
export default class MiningTaskSource extends Source {
  // Private
  #storage
  #key
  //
  #id
  #sub
  //
  #timestampInitialized
  #timestampCommitted
  #timestampSubmitted
  #timestampRejected
  #timestampResubmitted
  #timestampProceeded
  #timestampConfirmed
  //
  #work

  // TODO Add #timestampRejected, to restrict resubmit operation
  // PROVIDE this.#storage
  // PROVIDE this.#key
  // PROVIDE this.#id
  // PROVIDE this.#sub
  // PROVIDE this.#timestampInitialized
  // PROVIDE this.#timestampCommitted
  // PROVIDE this.#timestampSubmitted
  // PROVIDE this.#timestampRejected
  // PROVIDE this.#timestampResubmitted
  // PROVIDE this.#timestampProceeded
  // PROVIDE this.#timestampConfirmed
  // PROVIDE this.#work
  constructor({id, sub, timestampInitialized, timestampCommitted, timestampSubmitted, timestampRejected, timestampResubmitted, timestampProceeded, timestampConfirmed, work}, storage, key) {
    // Pass no attributes to parent model
    super()

    // Durable Object Storage
    this.#storage = storage
    this.#key = key

    // Generated identity in initialize()
    this.#id = id
    // Miner information
    this.#sub = sub
    // Timestamps and states
    this.#timestampInitialized = timestampInitialized // Initialized timestamp
    this.#timestampCommitted = timestampCommitted // Committed timestamp, the actual timestamp of the committed work
    this.#timestampSubmitted = timestampSubmitted // Submitted timestamp
    this.#timestampRejected = timestampRejected // Rejected timestamp
    this.#timestampResubmitted = timestampResubmitted // Resubmitted timestamp
    this.#timestampProceeded = timestampProceeded // Proceeded timestamp
    this.#timestampConfirmed = timestampConfirmed // Confirmed timestamp
    // Information for Proceeding
    this.#work = work // Work details, e.g. (SPoW) Social Proof of Work
  }

  // Object public attributes
  get attributes() {
    return {
      sub: this.#sub,
      id: this.#id ?? null,
      timestampInitialized: this.#timestampInitialized ?? null,
      timestampCommitted: this.#timestampCommitted ?? null,
      timestampSubmitted: this.#timestampSubmitted ?? null,
      timestampRejected: this.#timestampRejected ?? null,
      timestampResubmitted: this.#timestampResubmitted ?? null,
      timestampProceeded: this.#timestampProceeded ?? null,
      timestampConfirmed: this.#timestampConfirmed ?? null,
      work: this.#work ?? null
    }
  }

  get model() {
    return new MiningTask(this.attributes)
  }

  // ==========================================================================
  // Read / Write

  // Save current cloned object in Durable Object
  async save() {
    if (!this.#storage) {
      return false
    }

    try {
      // Only available when connected to Durable Object
      await this.#storage.put(this.#key, this.model)
      return true
    } catch (error) {
      return false
    }
  }

  // Reset the cloned object saved in Durable Object.
  async reset() {
    if (!this.#storage) {
      return false
    }

    try {
      await this.#storage.put(this.#key, { sub: this.#sub })
      return true
    } catch (error) {
      return false
    }
  }

  // ==========================================================================
  // States

  get isInitialized() {
    return this.#timestampInitialized !== undefined && this.#id !== undefined
  }

  get isCommitted() {
    return this.#timestampCommitted !== undefined
  }

  get isSubmitted() {
    return this.#timestampSubmitted !== undefined
  }

  get isRejected() {
    return this.#timestampRejected !== undefined
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
  // Operations: User permissions

  // Initialized Mining Task has random id and timestampInitialized.
  async initialize(callback) {
    if (this.isInitialized) {
      return false
    }
    
    try {
      // Random Id
      this.#id = await _.randomString()

      this.#timestampInitialized = Date.now()

      // Custom callback
      callback && await callback.bind(this)()

      // Trigger save operation
      return await this.save()
    } catch (error) {
      return false
    }
  }

  // CAREFUL: USER_INPUT
  // CHANGE this.#work
  // CHANGE this.#timestampSubmitted
  // CHANGE this.#timestampResubmitted
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
      return await this.save()
    }
    return false
  }

  // CHANGE this.#work
  // CHANGE this.#timestampResubmitted
  // CHANGE this.#timestampRejected
  async resubmit(work) {
    // Prerequisite check
    if (!this.isRejected) {
      return false
    }

    const result = await this.submit(work)
    if (result) {
      // Reset the rejected timestamp
      this.#timestampRejected = undefined
    }

    return result
  }

  // ==========================================================================
  // Operations: Admin permissions

  // TODO Use broker provided web service to automate "reject" process
  // Verify work and set committed
  async verifyWork() {

  }

  async setCommit(timestamp) {
    this.#timestampCommitted = timestamp

    return await this.save()
  }

  async reject(timestamp = Date.now()) {
    this.#timestampRejected = timestamp

    return await this.save()
  }

  async proceed(timestamp = Date.now()) {
    this.#timestampProceeded = timestamp

    return await this.save()
  }

  async confirm(timestamp = Date.now()) {
    this.#timestampConfirmed = timestamp

    return await this.save()
  }

  // ==========================================================================
  // Getter

  get sub() {
    return this.#sub
  }

  get minerId() {
    return this.#sub
  }

}
