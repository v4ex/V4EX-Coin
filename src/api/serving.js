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
