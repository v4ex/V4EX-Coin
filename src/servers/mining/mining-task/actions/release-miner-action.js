import Action from './action.js'

// ============================================================================
// Permissions
//
// Who: Broker
//
// Situation: Broker is trying to release the brokering Mining Task of the specific Miner to the Miner.


// ============================================================================
// 

export default class ReleaseMinerAction extends Action {

  // OVERRIDDEN
  // PROVIDE this.isAllowed
  async isAllowed() {
    if (! await super.isAllowed()) {
      return false
    }

    return await this.resource.canUserReleaseMiner(this.userFacade)
  }

  // CHANGE this.resource
  // CHANGE this.responseMessage
  // OVERRIDDEN
  async do() {
    this.doReleaseOperate('broker', 'miner', 'releaseMiner', 'released')
  }

}
