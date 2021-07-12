
import Action from './action.js'

export default class ViewAction extends Action {

  // CHANGE this.resource | this.webSocketServer.miningTask
  // CHANGE this.responseMessage
  /**
   * Before inter-exchanging messages, this.miningTask value has been initialized from DO storage or by code
   * Miner can only initialize a mining task if there is none exists
   * @returns 
   */
  async do() {
    if (!this.isAllowed) {
      this.disallow()
      return
    }

    const miningTask = this.resource
    const responseMessage = this.responseMessage
    
    if (miningTask.isInitialized) {
      responseMessage.setStatus(409, "Mining Task has been initialized before.") // "Conflict"
    } else { // Mining Task not yet initialized
      const initialized = await miningTask.initialize()
      if (initialized) {
        responseMessage.setStatus(201, "New Mining Task has been successfully initialized.") // "Created"
      }
    }

    // Add data to payload
    if (responseMessage.status < 400) {
      responseMessage.payload.miningTask = miningTask.clone
    }
  }

}
