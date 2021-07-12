
export default class Action {
  // PROVIDING this.webSocketServer
  // PROVIDING this.user
  // PROVIDING this.payload
  // PROVIDING this.responseMessage
  constructor(webSocketServer, user, payload, responseMessage) {
    this.webSocketServer = webSocketServer
    this.user = user
    this.payload = payload
    this.responseMessage = responseMessage
  }

  async do() {
  }
}
