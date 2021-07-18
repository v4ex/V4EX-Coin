import Action from './action.js'

// ============================================================================
// Permissions
//
// Situation: Minter is trying to submit work information to his own Mining Task.


// ============================================================================
// 

export default class ViewAction extends Action {

  // PROVIDE this.isAllowed
  // OVERRIDDEN
  async isAllowed() {
    return await this.isMinterUser()
  }

  // CHANGE this.webSocketServer
  // CHANGE this.resource | this.webSocketServer.miningTask
  // CHANGE this.responseMessage
  async do() {
    if (!await this.isAllowed()) {
      this.disallow()
      return
    }

    const miningTaskResource = this.resource
    const responseMessage = this.responseMessage

    await miningTaskResource.reset()

    responseMessage.setStatus(205, "Mining task has been successfully reset.") // "Reset Content"
  }
  
}
