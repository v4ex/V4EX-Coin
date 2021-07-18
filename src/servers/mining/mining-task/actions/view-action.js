import Action from './action.js'


// ============================================================================
// Permissions
//
// Situation A: Miner is trying to view his own Mining Task.
// Situation B: Broker is trying to view Mining Task that with submitted work managed by the same Broker.
// Situation C: Minter is trying to view any Mining Task.


// ============================================================================
// 

export default class ViewAction extends Action {

  // PROVIDE this.isAllowed
  // OVERRIDDEN
  async isAllowed() {
    const situationA = await this.isMinerUser() && await super.isAllowed()
    if (situationA) {
      return true
    }

    // TODO Check submitted work
    const situationB = await this.isBrokerUser()
    if (situationB) {
      return true
    }

    const situationC = await this.isMinterUser()
    if (situationC) {
      return true
    }
  }

  // CHANGE this.responseMessage
  async do() {
    if (!await this.isAllowed()) {
      this.disallow()
      return
    }
    
    const miningTaskResource = this.resource
    const responseMessage = this.responseMessage

    if (miningTaskResource.isInitialized) {
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
