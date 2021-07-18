import Resource from './resource.js'

export default class Action {

  // ==========================================================================
  // For Customization

  // OVERRIDE
  // PROVIDE this.isAllowed
  get isAllowed() {
    return true
  }

  // CHANGE this.responseMessage
  // OVERRIDE
  async react() {
    if (!await this.isAllowed()) {
      this.disallow()
      return
    }
    this.responseMessage.setStatus(200) // "OK"
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
   * @param {WebSocketSession} webSocketSession
   * @param {Resource} resource Target resource
   * @param {*} payload Payload in income message
   * @param {*} responseMessage Outgoing response message
   */
  constructor(webSocketServer, webSocketSession, resource, payload, responseMessage) {
    this.webSocketServer = webSocketServer
    this.webSocketSession = webSocketSession
    this.resource = resource
    this.user = webSocketSession.authenticationService.user
    this.payload = payload
    this.responseMessage = responseMessage
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
      return this.webSocketSession.authorizationService.isOwnerOf(this.resourceModel)
    } catch (error) {
      return false
    }
  }

  // PROVIDE this.isMinerUser
  async isMinerUser() {
    try {
      return await this.webSocketSession.authorizationService.isMiner()
    } catch (error) {
      return false
    }
  }

  // PROVIDE this.isBrokerUser
  async isBrokerUser() {
    try {
      return await this.webSocketSession.authorizationService.isBroker()
    } catch (error) {
      return false
    }
  }

  // PROVIDE this.isMinterUser
  async isMinterUser() {
    try {
      return await this.webSocketSession.authorizationService.isMinter()
    } catch (error) {
      return false
    }
  }

  // OVERRIDE
  // PROVIDE this.isValidResource
  get isValidResource() {
    if (!(this.resource instanceof Resource)) {
      return false
    }
    return true
  }

}
