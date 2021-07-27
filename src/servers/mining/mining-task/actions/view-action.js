import Action from './action.js'

// ============================================================================
// Permissions
//
// Who: [Miner, Broker, Minter]
//
// Situation.A: Miner is trying to view his own Mining Task.
// Situation.B: Broker is trying to view Mining Task that with submitted work managed by the same Broker.
// Situation.C: Minter is trying to view any Mining Task.


// ============================================================================
// 

export default class ViewAction extends Action {

  // OVERRIDDEN
  // PROVIDE this.isAllowed
  async isAllowed() {
    if (! await super.isAllowed()) {
      return false
    }

    return await this.resource.canUserView(this.userFacade)
  }

  // CHANGE this.responseMessage
  async do() {
    if (this.resource.canView) {
      this.responseMessage.setStatus(200, "The Mining Task is successfully viewed.")
    }
  }

}
