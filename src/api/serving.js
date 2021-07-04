import Api from "./api.js"

export default class Serving extends Api {

  async initialize() {
    await super.initialize()

    this.bindingName = 'SERVING'
    this.routePrefix = '/serving'

    this.userRoles = ['server']

  }

  async actionRoutes(action, payload, responseMessage) {
    switch (action) {
      // TODO
      case 'HELP': {
        // 501 "Not Implemented"
        responseMessage.setStatus(501)
        break
      }
      // TODO
      case 'LIST': {
        // 501 "Not Implemented"
        responseMessage.setStatus(501)
        break
      }
      case 'DEFAULT': {
        // 200 "OK"
        responseMessage.setStatus(200)

        responseMessage.payload.userInfo = this.authService.userInfo()

        break
      }
      default: {
        // Logging
        console.warn(this.sub, " is trying unknown " + action.toString())
        // 501 "Not Implemented"
        responseMessage.setStatus(501, `Unknown action: ${action}`)
      }
    }

    return responseMessage
  }

}
