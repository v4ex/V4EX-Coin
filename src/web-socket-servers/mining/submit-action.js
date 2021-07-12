import Action from '../action.js'

export default class SubmitAction extends Action {
  async do() {
    const miningTask = this.webSocketServer.miningTask
    const responseMessage = this.responseMessage
    const payload = this.payload

    if (!miningTask.isInitialized) { // Not yet initialized
      // 409 "Conflict"
      responseMessage.setStatus(409, "Mining Task is not yet initialized, run INITIALIZE first.")
    } else if (miningTask.isSubmitted) { // Already submitted
      // 409 "Conflict"
      responseMessage.setStatus(409, "Work information exists, RESUBMIT can override.")
    } else { // Initialized, but not yet submitted
      let submitted = await miningTask.submit(payload.work)                
      if (submitted) {
        // 201 "Created"
        responseMessage.setStatus(201, "New work information has been successfully submitted.")
      } else {
        // 406 "Not Acceptable"
        responseMessage.setStatus(406, "Submitted work details has failed in verification.")
      }
    }

    // Attach payload
    if (responseMessage.status < 400) {
      responseMessage.payload.miningTask = miningTask.clone
    }
  }
}
