import Action from './action.js'

// ============================================================================
// Permissions
//
// Who: Minter
//
// Situation: Minter is trying to release the Mining Task of the specific Miner to the corresponding Broker.


// ============================================================================
// 

export default class ReleaseBrokerAction extends Action {

  // OVERRIDDEN
  // PROVIDE this.isAllowed
  async isAllowed() {
    if (! await super.isAllowed()) {
      return false
    }

    return await this.resource.canUserReleaseBroker(this.userFacade)
  }

  // CHANGE this.resource
  // CHANGE this.responseMessage
  // OVERRIDDEN
  async do() {
    this.doReleaseOperate('minter', 'broker', 'releaseBroker', 'released')
  }

}
