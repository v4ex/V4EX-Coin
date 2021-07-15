import Action from './action.js'

export default class SubmitAction extends Action {

  // CHANGE this.resource | this.webSocketServer.miningTask -> this.webSocketServer.miningTask.#work
  // CHANGE this.responseMessage
  async do() {
    if (!this.isAllowed) {
      this.disallow()
      return
    }

    const miningTaskSource = this.source
    const miningTaskResource = this.resource
    const responseMessage = this.responseMessage
    const payload = this.payload

    if (!miningTaskSource.isInitialized) { // Not yet initialized
      responseMessage.setStatus(409, "Mining Task is not yet initialized, run INITIALIZE first.") // "Conflict"
    } else if (miningTaskSource.isSubmitted) { // Already submitted
      responseMessage.setStatus(409, "Work information exists, RESUBMIT can override.") // "Conflict"
    } else { // Initialized, but not yet submitted
      let submitted = await miningTaskResource.submit(payload.work)                
      if (submitted) {
        responseMessage.setStatus(201, "New work information has been successfully submitted.") // "Created"
      } else {
        responseMessage.setStatus(406, "Submitted work details has failed in verification.") // "Not Acceptable"
      }
    }

    // Attach payload
    if (responseMessage.status < 400) {
      responseMessage.payload.miningTask = miningTaskResource.view()
    }
  }

}
