import Action from './action.js'

// ============================================================================
// Permissions
//
// Who: Miner
//
// Situation: Miner is trying to edit his own Mining Task by adding work information.


// ============================================================================
// 

export default class EditAction extends Action {

  // OVERRIDDEN
  // PROVIDE this.isAllowed
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
    const payload = this.payload

    if (!miningTaskResource.isInMinerStage) {
      responseMessage.setStatus(403, "The Mining Task is out of Miner stage.") // "Forbidden"
    } else {
      if (!miningTaskResource.isInitialized) {
        responseMessage.setStatus(409, "The Mining Task has not been initialized yet. Use INITIALIZE.") // "Conflict"
      } else {
        if (miningTaskResource.isSubmitted) {
          responseMessage.setStatus(409, "The Mining Task has been submitted. Use REVERT_SUBMIT.") // "Conflict"
        } else {
          const edited = await miningTaskResource.edit(payload.work).catch(error => {
            responseMessage.setStatus(500, error.message) // Internal Server Error
            return
          })
          if (edited) {
            responseMessage.setStatus(200, "The Mining Task is successfully edited with valid work information.") // "OK"
          } else {
            responseMessage.setStatus(406, "The Mining Task is failed to be edited. The work information is failed in validation.") // "Not Acceptable"
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
