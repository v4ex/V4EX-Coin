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

    const webSocketServer = this.webSocketServer
    const miningTask = this.resource
    const responseMessage = this.responseMessage

    await miningTask.reset()
    await webSocketServer.initializeMiningTask()

    responseMessage.setStatus(205, "Mining task has been successfully reset.") // "Reset Content"
  }
  
}
