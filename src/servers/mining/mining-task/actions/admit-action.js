import Action from './action.js'

// ============================================================================
// Permissions
//
// Who: Minter
//
// Situation: Minter is trying to admit the Mining Task of the specific Miner confirmed by corresponding Broker.


// ============================================================================
// 

export default class AdmitAction extends Action {

  // OVERRIDDEN
  // PROVIDE this.isAllowed
  async isAllowed() {
    if (! await super.isAllowed()) {
      return false
    }

    return await this.resource.canUserAdmit(this.userFacade)
  }

  // CHANGE this.resource
  // CHANGE this.responseMessage
  // OVERRIDDEN
  async do() {
    await this.doOperate('minter', 'admit', 'admitted')
  }

}
