import Action from '../action.js'

export default class ViewAction extends Action {
  async do() {
    const webSocketServer = this.webSocketServer
    const miningTask = webSocketServer.miningTask
    const responseMessage = this.responseMessage

    await miningTask.reset()
    await webSocketServer.initializeMiningTask()

    responseMessage.setStatus(205, "Mining task has been successfully resetted.") // "Reset Content"
  }
}
