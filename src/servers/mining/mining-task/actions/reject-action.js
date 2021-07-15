import Action from './action.js'

// TODO

export default class RejectAction extends Action {

  // CHANGE this.source | this.webSocketServer.miningTask
  // CHANGE this.responseMessage
  async do() {
    if (!this.isAllowed) {
      this.disallow()
      return
    }
    
    const miningTask = this.resource
    const responseMessage = this.responseMessage

    if (miningTask.isInitialized) {
      responseMessage.setStatus(200, "Returning the initialized Mining Task.") // "OK"
    } else {
      responseMessage.setStatus(206, "Mining Task is not yet initialized. Use INITIALIZE.") // "Partial Content"
    }

    // Add data to payload
    if (responseMessage.status < 400) {
      responseMessage.payload.miningTask = miningTask.view()
    }
  }

}
