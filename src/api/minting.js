import Api from "./api.js"

export default class Minting extends Api {

  async initialize() {
    await super.initialize()

    this.bindingName = 'MINTING'
    this.routePrefix = '/minting'

    this.userRoles = ['minter']

  }

  async actionRoutes(action, payload, responseMessage) {

    switch (action) {
      case 'DEFAULT': {
        // 200 "OK"
        responseMessage.setStatus(200)
        break
      }
      default: {
        // Logging
        console.log(this.sub, " is trying unknown " + action.toString())
        // 501 "Not Implemented"
        responseMessage.setStatus(501)
      }
    }

    return responseMessage
  }

}
