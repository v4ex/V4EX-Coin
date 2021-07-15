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

    // Only allow resubmit if not proceeded
    if (miningTaskSource.isSubmitted) { // Submitted
      if (miningTaskSource.isProceeded) { // Submitted and proceeded
        responseMessage.setStatus(409, "RESUBMIT is disallowed. Mining task has been already proceeded.") // "Conflict"
      } else { // Submitted, but not yet proceeded
        // TODO Check if the same content
        let submitted = await miningTaskResource.submit(payload.work)                
        if (submitted) {
          responseMessage.setStatus(200, "Resubmitted work information has overridden previous one.") // "OK"
        } else {
          responseMessage.setStatus(406, "Resubmitted work details has failed in verification.") // "Not Acceptable"
        }
      }
    } else { // Not yet submitted
      responseMessage.setStatus(409, "RESUBMIT is disallowed. Work information is not yet existed, SUBMIT can create it.") // "Conflict"
    }

    // Attach payload
    if (responseMessage.status < 400) {
      responseMessage.payload.miningTask = miningTaskResource.view()
    }

  }

}
