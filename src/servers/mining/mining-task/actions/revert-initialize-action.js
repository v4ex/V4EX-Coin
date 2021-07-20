
import Action from './action.js'

// ============================================================================
// Permissions
//
// Who: Miner
//
// Situation: Miner is trying to revert initialization of his own Mining Task.


// ============================================================================
// 

export default class RevertInitializeAction extends Action {

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
    
    if (!miningTaskResource.isInitialized) {
      responseMessage.setStatus(409, "The Mining Task has not been initialized yet. Use INITIALIZE.") // "Conflict"
    } else {
      if (miningTaskResource.isEdited) {
        responseMessage.setStatus(409, "The Mining Task has been edited before. Use CLEAR_EDIT.") // "Conflict"
      } else {
        const initializationReverted = await miningTaskResource.revertInitialize().catch(error => {
          responseMessage.setStatus(500, error.message) // Internal Server Error
          return
        })
        if (initializationReverted) {
          responseMessage.setStatus(200, "Initialization of the Mining Task is successfully reverted.") // "OK"
        }
      }
    }

    // Add data to payload
    if (responseMessage.status < 400) {
      responseMessage.payload.miningTask = miningTaskResource.toModel()
    }
  }

}
