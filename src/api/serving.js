import Api from "./api.js"

export default class Serving extends Api {

  async initialize() {
    await super.initialize()

    this.bindingName = 'SERVING'
    this.routePrefix = '/serving'

    this.userRoles = ['server']

  }

  async actionRoutes(action, payload) {
    switch (action) {
      // TODO
      case 'HELP': {
        // 501 "Not Implemented"
        this.Response.setStatus(501)
        break
      }
      // TODO
      case 'LIST': {
        // 501 "Not Implemented"
        this.Response.setStatus(501)
        break
      }
      case 'DEFAULT': {
        // 200 "OK"
        this.Response.setStatus(200)

        this.Response.payload.userInfo = this.Auth.userInfo()

        break
      }
      default: {
        // Logging
        console.log(this.subscriber, " is trying unknown " + action.toString())
        // 501 "Not Implemented"
        this.Response.setStatus(501)
      }
    }
  }

}
