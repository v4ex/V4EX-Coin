import Action from './action.js'

// ============================================================================
// Permissions
//
// Situation: Broker is trying to proceed the brokering Mining Task.


// ============================================================================
// 

// TODO

export default class ProceedAction extends Action {

  // PROVIDE this.isAllowed
  // OVERRIDDEN
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

    if (miningTaskResource.isSubmitted) {
      responseMessage.setStatus(200, "Returning the initialized Mining Task.") // "OK"
    } else {
      responseMessage.setStatus(206, "Mining Task is not yet initialized. Use INITIALIZE.") // "Partial Content"
    }

    // Add data to payload
    if (responseMessage.status < 400) {
      responseMessage.payload.miningTask = miningTaskResource.toModel()
    }
  }

}
