import Action from './action.js'

// ============================================================================
// 

export default class ViewAction extends Action {

  // PROVIDE this.isAllowed
  // OVERRIDDEN
  async isAllowed() {
    if (! await super.isAllowed()) {
      return false
    }

    // this.webSocketSession.webSocket.send(JSON.stringify(await this.userFacade.isMinter())) // DEBUG

    return await this.resource.canUserView(this.userFacade)
  }

  // CHANGE this.responseMessage
  async do() {
    if (this.resource.canView) {
      this.responseMessage.setStatus(200, "The Mining Task is successfully viewed.")
    }
  }

}
