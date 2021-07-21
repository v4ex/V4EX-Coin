
import Action from './action.js'

// ============================================================================
// Permissions
//
// Who: Miner
//
// Situation: Miner is trying to initialize his own Mining Task.


// ============================================================================
// 

export default class InitializeAction extends Action {

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
  async react() {
    if (! await this.isAllowed()) {
      this.disallow()
      return
    }

    const miningTaskResource = this.resource
    const responseMessage = this.responseMessage
    
    if (!miningTaskResource.isInMinerStage) {
      responseMessage.setStatus(403, "The Mining Task is out of Miner stage.") // "Forbidden"
    } else {
      if (miningTaskResource.isInitialized) {
        responseMessage.setStatus(409, "The Mining Task has been initialized before.") // "Conflict"
      } else {
        const initialized = await miningTaskResource.initialize().catch(error => {
          responseMessage.setStatus(500, error.message) // Internal Server Error
        })
        if (initialized) {
          responseMessage.setStatus(201, "The Mining Task is successfully initialized.") // "Created"
        }
      }
    }

    // Add data to payload
    if (responseMessage.status < 400) {
      responseMessage.payload.miningTask = miningTaskResource.toModel()
    }
  }

}
