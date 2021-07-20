import Action from './action.js'


// ============================================================================
// Permissions
//
// Who: Miner, Broker, Minter
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
    if (! await super.isAllowed()) {
      return false
    }

    //
    const situationA = await this.isMinerUser() && this.isUserOwningTheResource
    if (situationA) {
      return true
    }

    //
    const situationB = await this.isMatchedBrokeringMiningTask()
    if (situationB) {
      return true
    }

    //
    const situationC = await this.isMinterUser()
    if (situationC) {
      return true
    }
  }

  // CHANGE this.responseMessage
  async react() {
    if (! await this.isAllowed()) {
      this.disallow()
      return
    }
    
    const miningTaskResource = this.resource
    const responseMessage = this.responseMessage

    if (miningTaskResource.isInitialized) {
      responseMessage.setStatus(200, "The Mining Task is successfully retrieved.") // "OK"
    } else {
      if (await this.isMinerUser()) {
        responseMessage.setStatus(206, "The Mining Task has not been initialized yet. Use INITIALIZE.") // "Partial Content"
      } else {
        responseMessage.setStatus(206, "The Mining Task has not been initialized yet.") // "Partial Content"
      }
    }

    // Add data to payload
    if (responseMessage.status < 400) {
      responseMessage.payload.miningTask = miningTaskResource.toModel()
    }
  }

}
