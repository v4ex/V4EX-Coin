
import _ from '../../../utilities/index.js'

import Schemas from '../../../schemas/schemas.js'

import { MiningTask } from './models/mining-task.js'

import Resource from '../../web-socket/resource.js'


import ViewAction from './actions/view-action.js'
import InitializeAction from './actions/initialize-action.js'
import RevertInitializeAction from './actions/revert-initialize-action.js'
import EditAction from './actions/edit-action.js'
import ClearEditAction from './actions/clear-edit-action.js'
import SubmitAction from './actions/submit-action.js'
import RevertSubmitAction from './actions/revert-submit-action.js'
import RejectAction from './actions/reject-action.js'
import ProceedAction from './actions/proceed-action.js'
import ReleaseMinerAction from './actions/release-miner-action.js'
import ConfirmAction from './actions/confirm-action.js'
import RevertConfirmAction from './actions/revert-confirm-action.js'
import DenyAction from './actions/deny-action.js'
import AdmitAction from './actions/admit-action.js'
import ReleaseBrokerAction from './actions/release-broker-action.js'


import ResetAction from './actions/reset-action.js'


// ============================================================================
// MiningTaskResourceActionsList

// PROTOCOL
export const MiningTaskResourceActionsList = new Map(Object.entries({
  'VIEW': ViewAction,
  'INITIALIZE': InitializeAction,
  'REVERT_INITIALIZE': RevertInitializeAction,
  'EDIT': EditAction,
  'CLEAR_EDIT': ClearEditAction,
  'SUBMIT': SubmitAction,
  'REVERT_SUBMIT': RevertSubmitAction,
  'REJECT': RejectAction,
  'PROCEED': ProceedAction,
  'RELEASE_MINER': ReleaseMinerAction,
  'CONFIRM': ConfirmAction,
  'REVERT_CONFIRM': RevertConfirmAction,
  'DENY': DenyAction,
  'ADMIT': AdmitAction,
  'RELEASE_BROKER': ReleaseBrokerAction,


  'RESET': ResetAction,
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
  #init
  #storage
  #key
  //
  #id
  #sub
  //
  #timestamps = {
    initializedAt: null, // Initialized timestamp
    editedAt: null,      // Last edited timestamp
    submittedAt: null,   // Submitted timestamp
    committedAt: null,   // Committed timestamp, the actual timestamp of the committed work
    rejectedAt: null,    // Rejected timestamp
    proceededAt: null,   // Proceeded timestamp
    confirmedAt: null,   // Confirmed timestamp
    deniedAt: null,      // Denied timestamp
    admittedAt: null,
    settledAt: null,
    publishedAt: null,
    finishedAt: null
  }
  //
  #work

  // PROVIDE this.#storage
  // PROVIDE this.#key
  // PROVIDE this.#id
  // PROVIDE this.#sub
  // PROVIDE this.#timestamps
  // PROVIDE this.#work
  // OVERRIDDEN
  constructor(init, storage, key) {
    super()

    this.#init = init

    // Durable Object Storage
    this.#storage = storage
    this.#key = key
  }

  // OVERRIDDEN
  async construct() {
    const {
      sub,
      id,
      timestamps,
      work
    } = await this.#storage.get(this.#key)

    // Miner information
    this.#sub = sub ?? this.#init.sub
    // Generated identity in initialize()
    this.#id = id
    // Timestamps and states
    Object.assign(this.#timestamps, timestamps)
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
      timestamps: Object.assign({}, this.#timestamps),
      work: this.#work ? Object.assign({}, this.#work) : null
    }
  }

  // OVERRIDDEN
  toModel() {
    return new MiningTask(this.attributes)
  }

  // ==========================================================================
  // Read / Write

  /**
   * Save data in Durable Object storage.
   * Possible Network Loss Error?
   */
  async save() {
    if (!this.#storage) {
      throw new Error("No storage.")
    }

    await this.#storage.put(this.#key, this.toModel())
  }

  // Reset the cloned object saved in Durable Object.
  async reset() {
    if (!this.#storage) {
      return false
    }

    try {
      await this.#storage.put(this.#key, { sub: this.#sub })

      this.#id = null
      this.#work = null
      
      for (const key in this.#timestamps) {
        this.#timestamps[key] = null
      }

      return true
    } catch (error) {
      return false
    }
  }

  // ==========================================================================
  // States
  // FIXME != null loose comparison for undefined and null.

  // PROVIDE this.isInitialized
  get isInitialized() {
    return this.#timestamps.initializedAt != null && this.#id != null
  }

  // PROVIDE this.isEdited
  get isEdited() {
    return this.isInitialized && this.#timestamps.editedAt != null && this.#work != null
  }

  // PROVIDE this.isSubmitted
  get isSubmitted() {
    return this.isEdited && this.#timestamps.submittedAt != null
  }

  // PROVIDE this.isCommitted
  get isCommitted() {
    return this.#timestamps.committedAt != null
  }

  // PROVIDE this.isRejected
  get isRejected() {
    return this.isSubmitted && this.#timestamps.rejectedAt != null
  }

  // PROVIDE this.isProceeded
  get isProceeded() {
    return this.isSubmitted && this.#timestamps.proceededAt != null
  }

  // PROVIDE this.isConfirmed
  get isConfirmed() {
    return this.isProceeded && this.#timestamps.confirmedAt != null
  }

  // PROVIDE this.isDenied
  get isDenied() {
    return this.isConfirmed && this.#timestamps.deniedAt != null
  }

  // PROVIDE this.isAdmitted
  get isAdmitted() {
    return this.isConfirmed && this.#timestamps.admittedAt != null
  }

  // PROVIDE this.isSettled
  get isSettled() {
    return this.isAdmitted && this.#timestamps.settledAt != null
  }

  // PROVIDE this.isPublished
  get isPublished() {
    return this.isSettled && this.#timestamps.publishedAt != null
  }

  // PROVIDE this.isFinished
  get isFinished() {
    return this.isPublished && this.#timestamps.finishedAt != null
  }

  // ==========================================================================
  // Multiple Stages Operation

  // PROVIDE this.canView
  get canView() {
    return true
  }

  // ==========================================================================
  // Miner Stage Operations

  // PROVIDE this.isInMinerStage
  get isInMinerStage() {
    return !this.isProceeded && !this.isRejected
  }

  // PROVIDE this.canInitialize
  get canInitialize() {
    return !this.isInitialized
  }

  // CHANGE this.#id
  // CHANGE this.#timestamps.initializedAt
  /**
   * Initialized Mining Task has random id and timestampInitialized.
   */
  async initialize() {
    if (this.canInitialize) {
      return false
    }

    // Random Id
    this.#id = await _.randomString()
    this.#timestamps.initializedAt = Date.now()

    await this.save().catch(error => {
      this.#id = null
      this.#timestamps.initializedAt = null
      throw new Error(error)
    })

    return true
  }

  // PROVIDE this.canRevertInitialize
  get canRevertInitialize() {
    return !this.isEdited && this.isInitialized
  }

  // CHANGE this.#id
  // CHANGE this.#timestamps.initializedAt
  async revertInitialize() {
    if (!this.isInitialized || this.isEdited) {
      return false
    }

    const original = {
      id: this.#id,
      initializedAt: this.#timestamps.initializedAt
    }
    this.#id = null
    this.#timestamps.initializedAt = null

    await this.save().catch(error => {
      this.#id = original.id
      this.#timestamps.initializedAt = original.initializedAt
      throw new Error(error)
    })

    return true
  }

  // PROVIDE this.canEdit
  get canEdit() {
    return !this.isSubmitted && this.isInitialized
  }

  // CAREFUL: USER_INPUT
  // CHANGE this.#timestamps.editedAt
  // CHANGE this.#work
  async edit(work) {
    // Prerequisite check
    if (!this.isInitialized || this.isSubmitted) {
      return false
    }

    let valid = await Schemas.validateSchema('mining-task-work', work)
    if (valid) {
      const original = {
        work: this.#work,
        editedAt: this.#timestamps.editedAt
      }

      this.#work = work
      this.#timestamps.editedAt = Date.now()

      await this.save().catch(error => {
        this.#work = original.work
        this.#timestamps.editedAt = original.editedAt
        throw new Error(error)
      })

      return true
    }
    return false
  }

  // PROVIDE this.canClearEdit
  get canClearEdit() {
    return !this.isSubmitted && this.isEdited
  }

  // CHANGE this.#timestamps.editedAt
  // CHANGE this.#work
  async clearEdit() {
    // Prerequisite check
    if (this.canClearEdit) {
      return false
    }

    const original = {
      work: this.#work,
      editedAt: this.#timestamps.editedAt
    }

    this.#work = null
    this.#timestamps.editedAt = null

    await this.save().catch(error => {
      this.#work = original.work
      this.#timestamps.editedAt = original.editedAt
      throw new Error(error)
    })

    return true
  }

  // PROVIDE this.canSubmit
  get canSubmit() {
    return !this.isSubmitted && this.isEdited
  }

  // CHANGE this.#timestamps.submittedAt
  async submit() {
    // Prerequisite check
    if (!this.canSubmit) {
      return false
    }

    const original = {
      submittedAt: this.#timestamps.submittedAt
    }

    this.#timestamps.submittedAt = Date.now()

    await this.save().catch(error => {
      this.#timestamps.submittedAt = original.submittedAt
      throw new Error(error)
    })

    return true
  }

    // PROVIDE this.canRevertSubmit
    get canRevertSubmit() {
      return !this.isProceeded && this.isSubmitted
    }

  // CHANGE this.#timestamps.submittedAt
  async revertSubmit() {
    // Prerequisite check
    if (!this.canRevertSubmit) {
      return false
    }

    const original = {
      submittedAt: this.#timestamps.submittedAt
    }

    this.#timestamps.submittedAt = null

    await this.save().catch(error => {
      this.#timestamps.submittedAt = original.submittedAt
      throw new Error(error)
    })

    return true
  }

  // TODO
  async restart() {
    await this.reset()
  }

  // ==========================================================================
  // Broker Stage Operations

  // PROVIDE this.isInBrokerStage
  get isInBrokerStage() {
    if (this.isSubmitted) {
      if (!this.isAdmitted && !this.isDenied) {
        return true
      }
    }
    return false
  }

  // PROVIDE this.canReject
  get canReject() {
    if (this.isSubmitted && !this.isConfirmed && !this.isRejected) {
      return true
    }
    return false
  }

  // CHANGE this.#timestamps.rejectedAt
  // CHANGE this.#timestamps.proceededAt
  async reject() {
    if (!this.canReject) {
      return false
    }

    const original = {
      proceededAt: this.#timestamps.proceededAt,
      rejectedAt: this.#timestamps.rejectedAt
    }
    this.#timestamps.proceededAt = null
    this.#timestamps.rejectedAt = Date.now()

    await this.save().catch(error => {
      this.#timestamps.proceededAt = original.proceededAt
      this.#timestamps.proceededAt = original.rejectedAt
      throw new Error(error)
    })

    return true
  }

  // PROVIDE this.canProceed
  get canProceed() {
    if (this.isSubmitted && !this.isConfirmed && !this.isProceeded) {
      return true
    }
    return false
  }

  // CHANGE this.#timestamps.proceededAt
  // CHANGE this.#timestamps.rejectedAt
  async proceed() {
    if (!this.canProceed) {
      return false
    }

    const original = {
      proceededAt: this.#timestamps.proceededAt,
      rejectedAt: this.#timestamps.rejectedAt
    }
    this.#timestamps.proceededAt = Date.now()
    this.#timestamps.rejectedAt = null

    await this.save().catch(error => {
      this.#timestamps.proceededAt = original.proceededAt
      this.#timestamps.proceededAt = original.rejectedAt
      throw new Error(error)
    })

    return true
  }

  // PROVIDE this.canReleaseMiner
  get canReleaseMiner() {
    if (!this.isConfirmed && this.isSubmitted) {
      if (this.isProceeded || this.isRejected) {
        return true
      }
    }
    return false
  }

  // CHANGE this.#timestamps.proceededAt
  // CHANGE this.#timestamps.rejectedAt
  // CHANGE this.#timestamps.submittedAt
  async releaseMiner() {
    if (!this.canReleaseMiner) {
      return false
    }

    const original = {
      submittedAt: this.#timestamps.submittedAt,
      proceededAt: this.#timestamps.proceededAt,
      rejectedAt: this.#timestamps.rejectedAt
    }
    this.#timestamps.submittedAt = null
    this.#timestamps.proceededAt = null
    this.#timestamps.rejectedAt = null

    await this.save().catch(error => {
      this.#timestamps.submittedAt = original.submittedAt
      this.#timestamps.proceededAt = original.proceededAt
      this.#timestamps.proceededAt = original.rejectedAt
      throw new Error(error)
    })

    return true
  }

  // PROVIDE this.canConfirm
  get canConfirm() {
    if (!this.isConfirmed && this.isProceeded) {
      return true
    }
    return false
  }

  // CHANGE this.#timestamps.confirmedAt
  async confirm() {
    if (!this.canConfirm) {
      return false
    }

    const original = {
      confirmedAt: this.#timestamps.confirmedAt
    }
    this.#timestamps.confirmedAt = Date.now()

    await this.save().catch(error => {
      this.#timestamps.confirmedAt = original.confirmedAt
      throw new Error(error)
    })

    return true
  }

  // PROVIDE this.canRevertConfirm
  get canRevertConfirm() {
    if (this.isConfirmed && !this.isAdmitted && !this.isDenied) {
      return true
    }
    return false
  }

  // CHANGE this.#timestamps.confirmedAt
  async revertConfirm() {
    if (!this.canRevertConfirm) {
      return false
    }

    const original = {
      confirmedAt: this.#timestamps.confirmedAt
    }
    this.#timestamps.confirmedAt = null

    await this.save().catch(error => {
      this.#timestamps.confirmedAt = original.confirmedAt
      throw new Error(error)
    })

    return true
  }


  // ==========================================================================
  // Minter Stage Operations

  // PROVIDE this.isInMinterStage
  get isInMinterStage() {
    return this.isConfirmed && !this.isSettled
  }

  // PROVIDE this.canDeny
  get canDeny() {
    return !this.isDenied && this.isConfirmed
  }

  // CHANGE this.#timestamps.admittedAt
  // CHANGE this.#timestamps.deniedAt
  async deny() {
    if (!this.canDeny) {
      return false
    }

    const original = {
      admittedAt: this.#timestamps.admittedAt,
      deniedAt: this.#timestamps.deniedAt
    }
    this.#timestamps.admittedAt = null
    this.#timestamps.deniedAt = Date.now()

    await this.save().catch(error => {
      this.#timestamps.admittedAt = original.admittedAt
      this.#timestamps.deniedAt = original.deniedAt
      throw new Error(error)
    })

    return true
  }

  // PROVIDE this.canAdmit
  get canAdmit() {
    return !this.isAdmitted && this.isConfirmed
  }

  // CHANGE this.#timestamps.admittedAt
  // CHANGE this.#timestamps.deniedAt
  async admit() {
    if (!this.canAdmit) {
      return false
    }

    const original = {
      admittedAt: this.#timestamps.admittedAt,
      deniedAt: this.#timestamps.deniedAt
    }
    this.#timestamps.admittedAt = Date.now()
    this.#timestamps.deniedAt = null

    await this.save().catch(error => {
      this.#timestamps.admittedAt = original.admittedAt
      this.#timestamps.deniedAt = original.deniedAt
      throw new Error(error)
    })

    return true
  }

  // PROVIDE this.canReleaseBroker
  get canReleaseBroker() {
    if (!this.isSettled && this.isConfirmed) {
      if (this.isAdmitted || this.isDenied) {
        return true
      }
    }
    return false
  }

  // CHANGE this.#timestamps.admittedAt
  // CHANGE this.#timestamps.deniedAt
  // CHANGE this.#timestamps.confirmedAt
  async releaseBroker() {
    if (!this.canReleaseBroker) {
      return false
    }

    const original = {
      admittedAt: this.#timestamps.admittedAt,
      deniedAt: this.#timestamps.deniedAt,
      confirmedAt: this.#timestamps.confirmedAt
    }
    this.#timestamps.admittedAt = null
    this.#timestamps.deniedAt = null
    this.#timestamps.confirmedAt = null

    await this.save().catch(error => {
      this.#timestamps.admittedAt = original.admittedAt
      this.#timestamps.deniedAt = original.deniedAt
      this.#timestamps.confirmedAt = original.confirmedAt
      throw new Error(error)
    })

    return true
  }

  // ==========================================================================
  // Server Middleman Operations

  // PROVIDE this.isInFinalStage
  get isInFinalStage() {
    if (this.isAdmitted) {
      return true
    }
    return false
  }

  async verify() {

  }

  async notify() {

  }

  async settled() {

  }

  async publish() {

  }

  async finish() {

  }

  // CHANGE this.#timestampCommitted
  async setCommit(timestamp) {
    this.#timestamps.committedAt = timestamp

    return await this.save()
  }

  // ==========================================================================
  // Getter

  // PROVIDE this.sub
  get sub() {
    return this.#sub
  }

  // PROVIDE this.minerId
  get minerId() {
    return this.#sub
  }

  // PROVIDE this.key
  get key() {
    return this.#key
  }

}
