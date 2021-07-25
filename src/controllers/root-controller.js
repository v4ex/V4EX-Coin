import AuthController from './auth-controller.js'


export default class RootController extends AuthController {

  // OVERRIDDEN
  // PROVIDE this.canHandle
  get canHandle() {
    if (this.url.pathname === '/') {
      return true
    }
    return false
  }

  // ENV AUTH0_MANAGEMENT_TOKEN
  // OVERRIDDEN
  async handleRequest() {
    const authenticated = await this.authenticate().catch(error => {
      return new Response("V4EX Coin", { status: 200 })
    })

    if (authenticated) {
      return new Response(JSON.stringify(this.authentication.user), { status: 200 })
    } else {
      return new Response("Unauthorized", { status: 401 })
    }
  }

}
