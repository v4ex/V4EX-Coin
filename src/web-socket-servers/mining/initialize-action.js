
import Action from '../action.js'

export default class ViewAction extends Action {
  // Before interexchanging messages, this.miningTask value has been initialized from DO storage or by code
  // Miner can only initialize a mining task if there is none exists
  async do() {
    const miningTask = this.webSocketServer.miningTask
    const responseMessage = this.responseMessage
    
    if (miningTask.isInitialized) {
      // 409 "Conflict"
      responseMessage.setStatus(409, "Mining Task has been initialized before.")
    } else { // Mining Task not yet initialized
      let initialized = await miningTask.initialize()
      if (initialized) {
        // 201 "Created"
        responseMessage.setStatus(201, "New Mining Task has been successfully initialized.")
      }
    }

    // DEBUG
    // console.log(`miningTask ${typeof miningTask} is: `, miningTask)

    // Add data to payload
    if (responseMessage.status < 400) {
      responseMessage.payload.miningTask = miningTask.clone
    }
  }
}
