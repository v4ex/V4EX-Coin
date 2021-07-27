
import Action from './action.js'

// ============================================================================
// Permissions
//
// Who: Broker
//
// Situation: Broker is trying to revert confirm the brokering Mining Task of the specific Miner.


// ============================================================================
// 


export default class RevertConfirmAction extends Action {

  // OVERRIDDEN
  // PROVIDE this.isAllowed
  async isAllowed() {
    if (! await super.isAllowed()) {
      return false
    }

    return await this.resource.canUserRevertConfirm(this.userFacade)
  }

  // CHANGE this.resource
  // CHANGE this.responseMessage
  // OVERRIDDEN
  async do() {
    await this.doRevertOperate('broker', 'confirm', 'confirmed')
  }

}
