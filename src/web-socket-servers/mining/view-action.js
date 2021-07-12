import Action from '../action.js'

export default class ViewAction extends Action {
  async do() {
    const miningTask = this.webSocketServer.miningTask
    const responseMessage = this.responseMessage

    if (miningTask.isInitialized) {
      // 200 "OK"
      responseMessage.setStatus(200, "Returning the initialized Mining Task.")
    } else {
      // 206 "Partial Content"
      responseMessage.setStatus(206, "Mining Task is not yet initialized. Use INITIALIZE.")
    }

    // Add data to payload
    if (responseMessage.status < 400) {
      responseMessage.payload.miningTask = miningTask.clone
    }
  }
}
