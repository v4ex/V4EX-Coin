import Action from './action.js'

export default class SubmitAction extends Action {

  // CHANGE this.resource | this.webSocketServer.miningTask -> this.webSocketServer.miningTask.#work
  // CHANGE this.responseMessage
  async do() {
    if (!this.isAllowed) {
      this.disallow()
      return
    }

    const miningTask = this.resource
    const responseMessage = this.responseMessage
    const payload = this.payload

    if (!miningTask.isInitialized) { // Not yet initialized
      responseMessage.setStatus(409, "Mining Task is not yet initialized, run INITIALIZE first.") // "Conflict"
    } else if (miningTask.isSubmitted) { // Already submitted
      responseMessage.setStatus(409, "Work information exists, RESUBMIT can override.") // "Conflict"
    } else { // Initialized, but not yet submitted
      let submitted = await miningTask.submit(payload.work)                
      if (submitted) {
        responseMessage.setStatus(201, "New work information has been successfully submitted.") // "Created"
      } else {
        responseMessage.setStatus(406, "Submitted work details has failed in verification.") // "Not Acceptable"
      }
    }

    // Attach payload
    if (responseMessage.status < 400) {
      responseMessage.payload.miningTask = miningTask.clone
    }
  }

}
