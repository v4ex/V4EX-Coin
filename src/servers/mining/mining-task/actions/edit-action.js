import Action from './action.js'

// ============================================================================
// Permissions
//
// Who: Miner
//
// Situation: Miner is trying to edit his own Mining Task by adding work information.


// ============================================================================
// 

export default class EditAction extends Action {

  // OVERRIDDEN
  // PROVIDE this.isAllowed
  async isAllowed() {
    if (! await super.isAllowed()) {
      return false
    }

    return await this.resource.canUserEdit(this.userFacade)
  }

  // CHANGE this.resource
  // CHANGE this.responseMessage
  async do() {
    await this.doOperate('miner', 'edit', 'edited', [this.payload.work])
  }

}
