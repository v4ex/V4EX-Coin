import Action from './action.js'

// ============================================================================
// Permissions
//
// Situation: Broker is trying to proceed the brokering Mining Task of the specific Miner.


// ============================================================================
// 

export default class ProceedAction extends Action {

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
    await this.doOperate('broker', 'proceed', 'proceeded')
  }

}
