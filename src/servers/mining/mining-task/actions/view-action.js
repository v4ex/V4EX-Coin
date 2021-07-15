import Action from './action.js'


export default class ViewAction extends Action {

  // CHANGE this.responseMessage
  async do() {
    if (!this.isAllowed) {
      this.disallow()
      return
    }
    
    const miningTaskSource = this.source
    const miningTaskResource = this.resource
    const responseMessage = this.responseMessage

    if (miningTaskSource.isInitialized) {
      responseMessage.setStatus(200, "Returning the initialized Mining Task.") // "OK"
    } else {
      responseMessage.setStatus(206, "Mining Task is not yet initialized. Use INITIALIZE.") // "Partial Content"
    }

    // Add data to payload
    if (responseMessage.status < 400) {
      responseMessage.payload.miningTask = miningTaskResource.view()
    }
  }

}
