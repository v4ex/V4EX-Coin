
import Action from './action.js'

// ============================================================================
// Permissions
//
// Who: Miner
//
// Situation: Miner is trying to revert initialization of his own Mining Task.


// ============================================================================
// 

export default class RevertInitializeAction extends Action {

  // PROVIDE this.isAllowed
  // OVERRIDDEN
  async isAllowed() {
    if (! await super.isAllowed()) {
      return false
    }

    return await this.isMinerUser() && this.isUserOwningTheResource
  }

  // CHANGE this.resource
  // CHANGE this.responseMessage
  async do() {
    await this.doRevertOperate('miner', 'initialize', 'initialized')
  }

}
