
import Action from './action.js'

// ============================================================================
// Permissions
//
// Who: Broker
//
// Situation: Broker is trying to confirm the brokering Mining Task of specific Miner.


// ============================================================================
// 


export default class ConfirmAction extends Action {

  // OVERRIDDEN
  // PROVIDE this.isAllowed
  async isAllowed() {
    if (! await super.isAllowed()) {
      return false
    }

    return await this.resource.canUserConfirm(this.userFacade)
  }

  // CHANGE this.resource
  // CHANGE this.responseMessage
  // OVERRIDDEN
  async do() {
    await this.doOperate('broker', 'confirm', 'confirmed')
  }

}
