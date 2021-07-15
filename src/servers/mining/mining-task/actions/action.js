import { default as BaseAction } from '../../../web-socket/action.js'

export default class Action extends BaseAction {

  // TODO Broker, Minter permissions
  get isAllowed() {
    // Undefined resource
    if (!this.resource) {
      return false
    }

    const authorizationService = this.webSocketServer.authorizationService
    const miningTask = this.resource.source.model
    
    return authorizationService.isOwnerOf(miningTask)
  }
  
}
