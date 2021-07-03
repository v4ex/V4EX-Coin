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
        console.log(this.subscriber, " is trying unknown " + action.toString())
        // 400 "Bad Request"
        this.Response.setStatus(400)
      }
    }
  }

}
