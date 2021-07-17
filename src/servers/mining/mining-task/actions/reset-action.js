import Action from './action.js'

export default class ViewAction extends Action {

  // CHANGE this.webSocketServer
  // CHANGE this.resource | this.webSocketServer.miningTask
  // CHANGE this.responseMessage
  async do() {
    if (!this.isAllowed) {
      this.disallow()
      return
    }

    const miningTaskResource = this.resource
    const responseMessage = this.responseMessage

    await miningTaskResource.reset()

    responseMessage.setStatus(205, "Mining task has been successfully reset.") // "Reset Content"
  }
  
}
