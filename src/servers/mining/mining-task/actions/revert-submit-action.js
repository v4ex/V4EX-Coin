import Action from './action.js'

// ============================================================================
// Permissions
//
// Who: Miner
//
// Situation: Miner is trying to revert submit of his own Mining Task.


// ============================================================================
// 

export default class RevertSubmitAction extends Action {

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
      if (!miningTaskResource.isInitialized) {
        responseMessage.setStatus(409, "The Mining Task has not been initialized yet. Use INITIALIZE.") // "Conflict"
      } else {
        if (!miningTaskResource.isEdited) {
          responseMessage.setStatus(409, "The Mining Task has not been edited yet. Use EDIT.") // "Conflict"
        } else {
          if (!miningTaskResource.isSubmitted) {
            responseMessage.setStatus(409, "The Mining Task has not been submitted yet. Use SUBMIT.") // "Conflict"
          } else {
            const revertSubmitted = await miningTaskResource.revertSubmit().catch(error => {
              responseMessage.setStatus(500, error.message) // Internal Server Error
            })
            if (revertSubmitted) {
              responseMessage.setStatus(200, "Submit of the Mining Task is successfully reverted.") // "OK"
            }
          }
        }
      }
    }

    // Attach payload
    if (responseMessage.status < 400) {
      responseMessage.payload.miningTask = miningTaskResource.toModel()
    }
  }

}
