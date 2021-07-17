
import _ from '../../../utilities/index.js'

import SchemasService from '../../../services/schemas-service.js'

import { MiningTask } from './models/mining-task.js'

import Resource from '../../web-socket/resource.js'

import ViewAction from './actions/view-action.js'
import InitializeAction from './actions/initialize-action.js'
import SubmitAction from './actions/submit-action.js'
import RejectAction from './actions/reject-action.js'
import ResubmitAction from './actions/resubmit-action.js'
import ResetAction from './actions/reset-action.js'


// ============================================================================
// MiningTaskResourceActionsList

// PROTOCOL
export const MiningTaskResourceActionsList = new Map(Object.entries({
  'VIEW': ViewAction,
  'INITIALIZE': InitializeAction,
  'SUBMIT': SubmitAction,
  'REJECT': RejectAction,
  'RESUBMIT': ResubmitAction,
  'RESET': ResetAction
}))

// ============================================================================
// MiningTaskResource
//
// Ownable < Model
// Stored in Miner Durable Object

/**
 * @typedef MiningTask
 * @type {object}
 * 
 * @property {MiningTask} model 
 */
export default class MiningTaskResource extends Resource {
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
  // OVERRIDDEN
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

  // OVERRIDDEN
  get actionsList() {
    return MiningTaskResourceActionsList
  }

  // Object public attributes
  // OVERRIDDEN
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

  // OVERRIDDEN
  toModel() {
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
      await this.#storage.put(this.#key, this.toModel())
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

      this.#id = undefined
      this.#timestampInitialized = undefined
      this.#timestampCommitted = undefined
      this.#timestampSubmitted = undefined
      this.#timestampRejected = undefined
      this.#timestampResubmitted = undefined
      this.#timestampProceeded = undefined
      this.#timestampConfirmed = undefined
      this.#work = undefined

      return true
    } catch (error) {
      return false
    }
  }

  // ==========================================================================
  // States

  get isInitialized() {
    return this.#timestampInitialized != null && this.#id != null
  }

  get isCommitted() {
    return this.#timestampCommitted != null
  }

  get isSubmitted() {
    return this.#timestampSubmitted != null
  }

  get isRejected() {
    return this.#timestampRejected != null
  }

  get isResubmitted() {
    return this.#timestampResubmitted != null
  }

  get isProceeded() {
    return this.#timestampProceeded != null
  }

  get isConfirmed() {
    return this.#timestampConfirmed != null
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
