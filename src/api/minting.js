import Api from "./api.js"

export default class Minting extends Api {

  async initialize() {
    await super.initialize()

    this.bindingName = 'MINTING'
    this.routePrefix = '/minting'

    this.userRoles = ['minter']

  }

  async actionRoutes(action, payload) {
    switch (action) {
      case 'DEFAULT': {
        // 200 "OK"
        this.Response.setStatus(200)

        this.Response.payload.userInfo = this.Auth.userInfo()

        break
      }
      default: {
        // Logging
        console.log(this.sub, " is trying unknown " + action.toString())
        // 501 "Not Implemented"
        this.Response.setStatus(501)
      }
    }
  }

}
