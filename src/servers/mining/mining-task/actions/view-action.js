import Action from './action.js'


// ============================================================================
// Permissions
//
// Who: Miner, Broker, Minter
//
// Situation A: Miner is trying to view his own Mining Task.
// Situation B: Broker is trying to view Mining Task that with submitted work managed by the same Broker.
// Situation C: Minter is trying to view any Mining Task.


// ============================================================================
// 

export default class ViewAction extends Action {

  // PROVIDE this.isAllowed
  // OVERRIDDEN
  async isAllowed() {
    if (! await super.isAllowed()) {
      return false
    }

    //
    const situationA = await this.isMinerUser() && this.isUserOwningTheResource
    if (situationA) {
      return true
    }

    //
    const situationB = await this.isMatchedBrokeringMiningTask()
    if (situationB) {
      return true
    }

    //
    const situationC = await this.isMinterUser()
    if (situationC) {
      return true
    }
  }

  // CHANGE this.responseMessage
  async do() {
    if (this.resource.canView) {
      this.responseMessage.setStatus(200, "The Mining Task is successfully viewed.")
    }
  }

}
