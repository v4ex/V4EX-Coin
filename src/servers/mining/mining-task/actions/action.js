import { default as BaseAction } from '../../../web-socket/action.js'
import MiningTaskResource from '../mining-task-resource.js'

// ============================================================================
// Permissions
//
// Situation: Authenticated User is trying to operate on his own Resource.


// ============================================================================
// 

export default class Action extends BaseAction {

  // OVERRIDDEN
  // PROVIDE this.isAllowed
  async isAllowed() {
    // Validate resource
    if (!this.isValidResource) {
      return false
    }

    return this.isAuthenticatedUser
  }

  // ==========================================================================
  // Helpers

  // OVERRIDDEN
  // PROVIDE this.isValidResource
  get isValidResource() {
    if (!(this.resource instanceof MiningTaskResource)) {
      return false
    }
    return true
  }

  // ENV MINING_BROKERS
  /**
   * Test if the Brokering Mining Task match the current acting Broker.
   */
  async isMatchedBrokeringMiningTask() {
    // Acting user must be a broker.
    if (! await this.isBrokerUser()) {
      return false
    }

    // Mining Task work must be submitted.
    const miningTaskResource = this.resource
    if (!miningTaskResource.isSubmitted) {
      return false
    }
    
    // Check work information
    const miningTask = this.resourceModel
    if (this.user.id !== JSON.parse(process.env.MINING_BROKERS)[miningTask.work.server]) {
      return false
    }

    return true
  }

}
