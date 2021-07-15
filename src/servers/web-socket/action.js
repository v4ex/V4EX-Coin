
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
  // PROVIDE this.source
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
    this.source = resource.source
    this.user = user
    this.payload = payload
    this.responseMessage = responseMessage
  }

  // CHANGE this.responseMessage
  disallow() {
    this.responseMessage.setStatus(403) // "Forbidden"
  }

  // PROVIDE this.sourceModel
  get sourceModel() {
    return this.source.model
  }

}
