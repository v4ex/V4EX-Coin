import { default as BaseAction } from '../../../web-socket/action.js'

// ============================================================================
// Permissions
//
// Situation: Authenticated User is trying to operate on his own Resource.


// ============================================================================
// 

export default class Action extends BaseAction {

  // PROVIDE this.isAllowed
  // OVERRIDDEN
  async isAllowed() {
    return this.isAuthenticatedUser && this.isUserOwningTheResource
  }

}
