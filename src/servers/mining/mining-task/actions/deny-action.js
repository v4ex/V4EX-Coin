import Action from './action.js'

// ============================================================================
// Permissions
//
// Situation: Minter is trying to deny the Mining Task of the specific Miner confirmed by corresponding Broker.


// ============================================================================
// 

export default class DenyAction extends Action {

  // OVERRIDDEN
  // PROVIDE this.isAllowed
  async isAllowed() {
    if (! await super.isAllowed()) {
      return false
    }

    return await this.isMinterUser()
  }

  // CHANGE this.resource
  // CHANGE this.responseMessage
  // OVERRIDDEN
  async do() {
    await this.doOperate('minter', 'deny', 'denied')
  }

}
