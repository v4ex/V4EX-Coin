import Action from './action.js'

// ============================================================================
// Permissions
//
// Who: Miner
//
// Situation: Miner is trying to submit his own Mining Task for verification.


// ============================================================================
// 

export default class SubmitAction extends Action {

  // PROVIDE this.isAllowed
  // OVERRIDDEN
  async isAllowed() {
    if (! await super.isAllowed()) {
      return false
    }

    return await this.resource.canUserSubmit(this.userFacade)
  }

  // CHANGE this.resource
  // CHANGE this.responseMessage
  async do() {
    await this.doOperate('miner', 'submit', 'submitted')
  }

}
