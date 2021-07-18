
export default class Action {

  // ==========================================================================
  // For Customization

  // PROVIDE this.isAllowed
  get isAllowed() {
    return true
  }

  async do() {
    if (this.isAllowed) {
      this.responseMessage.setStatus(200) // "OK"
    } else {
      this.disallow()
    }
  }

  // ==========================================================================
  // 

  // PROVIDE this.webSocketServer
  // PROVIDE this.resource
  // PROVIDE this.user
  // PROVIDE this.payload
  // PROVIDE this.responseMessage
  /**
   * 
   * @param {WebSocketServer} webSocketServer 
   * @param {Resource} resource Target resource
   * @param {User} user User model
   * @param {*} payload Payload in income message
   * @param {*} responseMessage Outgoing response message
   */
  constructor(webSocketServer, resource, user, payload, responseMessage) {
    this.webSocketServer = webSocketServer
    this.resource = resource
    this.user = user
    this.payload = payload
    this.responseMessage = responseMessage
  }

  // PROVIDE this.isAllowed
  // OVERRIDE
  async isAllowed() {
    return true
  }

  // CHANGE this.responseMessage
  // OVERRIDE
  async do() {
    if (!await this.isAllowed()) {
      this.disallow()
      return
    }
    this.responseMessage.setStatus(200) // "OK"
  }

  // ==========================================================================
  // Helpers

  // CHANGE this.responseMessage
  disallow() {
    if (this.user) {
      this.responseMessage.setStatus(403) // "Forbidden"
    } else {
      this.responseMessage.setStatus(401) // "Unauthorized"
    }
  }

  // PROVIDE this.resourceModel
  get resourceModel() {
    return this.resource.toModel()
  }

  // PROVIDE this.isAuthenticatedUser
  // Check if the user is authenticated.
  get isAuthenticatedUser() {
    if (this.user) {
      return true
    }
    return false
  }

  // PROVIDE this.isUserOwningTheResource
  // Check if the authenticated user is owning the target resource.
  get isUserOwningTheResource() {
    if (!this.resource || !this.user) {
      return false
    }

    try {
      return this.webSocketServer.authorizationService.isOwnerOf(this.resourceModel)
    } catch (error) {
      return false
    }
  }

  // PROVIDE this.isMinerUser
  async isMinerUser() {
    try {
      return await this.webSocketServer.authorizationService.isMiner()
    } catch (error) {
      return false
    }
  }

  // PROVIDE this.isBrokerUser
  async isBrokerUser() {
    try {
      return await this.webSocketServer.authorizationService.isBroker()
    } catch (error) {
      return false
    }
  }

  // PROVIDE this.isMinterUser
  async isMinterUser() {
    try {
      return await this.webSocketServer.authorizationService.isMinter()
    } catch (error) {
      return false
    }
  }

}
