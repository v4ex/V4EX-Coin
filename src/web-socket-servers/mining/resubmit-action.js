import Action from '../action.js'

export default class SubmitAction extends Action {
  async do() {
    const miningTask = this.webSocketServer.miningTask
    const responseMessage = this.responseMessage
    const payload = this.payload

    // Only allow resubmit if not proceeded
    if (miningTask.isSubmitted) { // Submitted
      if (miningTask.isProceeded) { // Submitted and proceeded
        // 409 "Conflict";
        responseMessage.setStatus(409, "RESUBMIT is disallowed. Mining task has been already proceeded.")
      } else { // Submitted, but not yet proceeded
        // TODO Check if the same content
        let submitted = await miningTask.submit(payload.work)                
        if (submitted) {
          // 200 'OK'
          responseMessage.setStatus(200, "Resubmitted work information has overridden previous one.")
        } else {
          // 406 "Not Acceptable"
          responseMessage.setStatus(406, "Resubmitted work details has failed in verification.")
        }
      }
    } else { // Not yet submitted
      // 409 "Conflict"
      responseMessage.setStatus(409, "RESUBMIT is disallowed. Work information is not yet existed, SUBMIT can create it.")
    }

    // Attach payload
    if (responseMessage.status < 400) {
      responseMessage.payload.miningTask = miningTask.clone
    }

  }
}
