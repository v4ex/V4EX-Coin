
import Action from './action.js'

// ============================================================================
// Permissions
//
// Situation A: Miner is trying to initialize his own Mining Task.


// ============================================================================
// 

export default class ViewAction extends Action {

  // PROVIDE this.isAllowed
  // OVERRIDDEN
  async isAllowed() {
    if (! await super.isAllowed()) {
      return false
    }

    return await this.isMinerUser() && this.isUserOwningTheResource
  }

  // CHANGE this.resource
  // CHANGE this.responseMessage
  /**
   * Before inter-exchanging messages, this.miningTask value has been initialized from DO storage or by code
   * Miner can only initialize a mining task if there is none exists
   * @returns 
   */
  async react() {
    if (! await this.isAllowed()) {
      this.disallow()
      return
    }

    const miningTaskResource = this.resource
    const responseMessage = this.responseMessage
    
    if (miningTaskResource.isInitialized) {
      responseMessage.setStatus(409, "Mining Task has been initialized before.") // "Conflict"
    } else { // Mining Task not yet initialized
      const initialized = await miningTaskResource.initialize()
      if (initialized) {
        responseMessage.setStatus(201, "New Mining Task has been successfully initialized.") // "Created"
      }
    }

    // Add data to payload
    if (responseMessage.status < 400) {
      responseMessage.payload.miningTask = miningTaskResource.toModel()
    }
  }

}
