import Action from './action.js'

// ============================================================================
// Permissions
//
// Situation: Broker is trying to reject the brokering Mining Task.


// ============================================================================
// 

// TODO

export default class RejectAction extends Action {

  // PROVIDE this.isAllowed
  // OVERRIDDEN
  async isAllowed() {
    if (! await super.isAllowed()) {
      return false
    }

    // TODO Brokering work check
    return await this.isBrokerUser()
  }

  // CHANGE this.resource
  // CHANGE this.responseMessage
  async react() {
    if (! await this.isAllowed()) {
      this.disallow()
      return
    }
    
    const miningTaskResource = this.resource
    const responseMessage = this.responseMessage

    if (miningTaskResource.isProceeded) {
      responseMessage.setStatus(409, "Mining Task has been proceeded. Use ROLLBACK.") // "Conflict"
    } else {
      if (miningTaskResource.isRejected) {
        responseMessage.setStatus(409, "Mining Task has been rejected. Use ROLLBACK.") // "Conflict"
      } else {
        if (miningTaskResource.isConfirmed) {
          responseMessage.setStatus(403, "Mining Task has been confirmed. Contact Minter to RESET.") // "Forbidden"
        } else {
          if (await miningTaskResource.proceed()) {
            responseMessage.setStatus(200, "Mining Task is successfully proceeded.") // "OK"
          }
        }
      }
    }

    // Add data to payload
    if (responseMessage.status < 400) {
      responseMessage.payload.miningTask = miningTaskResource.toModel()
    }
  }

}
