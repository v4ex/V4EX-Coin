import Action from './action.js'

// ============================================================================
// Permissions
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

    return await this.isMatchedBrokeringMiningTask()
  }

  // CHANGE this.resource
  // CHANGE this.responseMessage
  // OVERRIDDEN
  async do() {
    this.doReleaseOperate('broker', 'miner', 'releaseMiner', 'released')
  }

}
