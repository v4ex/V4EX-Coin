import { default as BaseAction } from '../action.js'

export default class Action extends BaseAction {

  get isAllowed() {
    const authorizationService = this.webSocketServer.authorizationService
    const user = this.user
    const miningTask = this.resource

    return authorizationService.isOwnedBy(miningTask, user)
  }
  
}
