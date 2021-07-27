import Action from './action.js'

// ============================================================================
// Permissions
//
// Situation: Broker is trying to reject the brokering Mining Task of the specific Miner.


// ============================================================================
// 

export default class RejectAction extends Action {

  // OVERRIDDEN
  // PROVIDE this.isAllowed
  async isAllowed() {
    if (! await super.isAllowed()) {
      return false
    }

    return await this.resource.canUserReject(this.userFacade)
  }

  // CHANGE this.resource
  // CHANGE this.responseMessage
  // OVERRIDDEN
  async do() {
    await this.doOperate('broker', 'reject', 'rejected')
  }

}
