
import Action from './action.js'

// ============================================================================
// Permissions
//
// Situation: Broker is trying to confirm the brokering Mining Task of specific Miner.


// ============================================================================
// 


export default class ConfirmAction extends Action {

  // OVERRIDDEN
  // PROVIDE this.isAllowed
  async isAllowed() {
    if (! await super.isAllowed()) {
      return false
    }

    return await this.isMatchedBrokeringMiningTask()
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

    // this.isMatchedBrokeringMiningTask() has already checked miningTaskResource.isSubmitted
    
    if (miningTaskResource.isConfirmed) {
      responseMessage.setStatus(403, "Mining Task has been confirmed before. Contact Minter to RESET.") // "Forbidden"
    } else {
      if (!miningTaskResource.isProceeded) {
        responseMessage.setStatus(409, "Mining Task has not yet been proceeded before. Use PROCEED.") // "Conflict"
      } else {
        const confirmed = await miningTaskResource.confirm()
        if (confirmed) {
          responseMessage.setStatus(200, "Mining Task is successfully confirmed.") // "OK"
        }
      }
    }

    // Add data to payload
    if (responseMessage.status < 400) {
      responseMessage.payload.miningTask = miningTaskResource.toModel()
    }
  }

}
