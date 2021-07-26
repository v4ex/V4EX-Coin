import Resource from './resource.js'

export default class Action {

  // ==========================================================================
  // 

  // CHANGE broadcastPermissions
  // PROVIDE this.webSocketServer
  // PROVIDE this.webSocketSession
  // PROVIDE this.resource
  // PROVIDE this.user
  // PROVIDE this.action
  // PROVIDE this.payload
  // PROVIDE this.responseMessage
  // PROVIDE this.broadcastMessage
  // PROVIDE this.broadcastEnabled
  // PROVIDE this.broadcastPermissions
  // REFERENCE this.responseMessage
  // REFERENCE this.broadcastMessage
  // REFERENCE this.broadcastPermissions
  /**
   * 
   * @param {WebSocketServer} webSocketServer 
   * @param {WebSocketSession} webSocketSession
   * @param {Resource} resource Target resource
   * @param {*} action
   * @param {*} payload Payload in income message
   * @param {*} responseMessage Outgoing response message
   * @param {*} broadcastMessage
   * @param {*} broadcastPermissions
   */
   constructor(webSocketServer, webSocketSession, resource, action, payload, responseMessage, broadcastMessage, broadcastPermissions) {
    this.webSocketServer = webSocketServer
    this.webSocketSession = webSocketSession
    this.resource = resource
    this.user = webSocketSession.authentication.user
    this.action = action
    this.payload = payload
    this.responseMessage = responseMessage
    this.broadcastMessage = broadcastMessage
    this.broadcastEnabled = false
    this.broadcastPermissions = broadcastPermissions
  }

  // ==========================================================================
  // For Customization

  // HOOK
  // OVERRIDE
  // PROVIDE this.isAllowed
  get isAllowed() {
    return true
  }

  // HOOK
  // OVERRIDE
  async do() {
    this.responseMessage.setStatus(200) // "OK"
  }

  // CHANGE this.responseMessage
  // HOOK
  // OVERRIDE_ADVANCED
  async react() {
    if (! await this.isAllowed()) {
      this.disallow()
      return
    }
    
    // HOOK
    await this.do()

    // Attach resource to payload
    if (this.responseMessage.status < 400) {
      this.responseMessage.payload[this.resource.key] = this.resourceModel
    }

    // Advise client to use HELP.
    if (this.responseMessage.status >= 400 && this.responseMessage.status < 500) {
      this.responseMessage.statusMessage.concat(" Use HELP to get more information.")
    }

    // Normal broadcast
    if (this.responseMessage.status < 400) {
      if (this.broadcastEnabled) {
        this.broadcastMessage[this.resource.key] = this.resourceModel
      }
    }
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
      return this.webSocketSession.authorization.isOwnerOf(this.resourceModel)
    } catch (error) {
      return false
    }
  }

  // PROVIDE this.isMinerUser
  async isMinerUser() {
    try {
      return await this.webSocketSession.authorization.isMiner()
    } catch (error) {
      return false
    }
  }

  // PROVIDE this.isBrokerUser
  async isBrokerUser() {
    try {
      return await this.webSocketSession.authorization.isBroker()
    } catch (error) {
      return false
    }
  }

  // PROVIDE this.isMinterUser
  async isMinterUser() {
    try {
      return await this.webSocketSession.authorization.isMinter()
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
