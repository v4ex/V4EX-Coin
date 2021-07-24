import Controller from './controller.js'
import _ from '../utilities/index.js'
import Authentication from '../auth/authentication.js'


export default class RootController extends Controller {

  // OVERRIDDEN
  // PROVIDE this.canHandle
  get canHandle() {
    if (this.url.pathname === '/') {
      return true
    }
    return false
  }

  // ENV AUTH0_MANAGEMENT_TOKEN
  async handleRequest() {
    return this.index(this.env.AUTH0_MANAGEMENT_TOKEN, this.request)
  }

  async index(managementToken, request) {
    const authentication = new Authentication(managementToken)
    const token = _.getAuthorizationBearerFromRequest(request)

    if (token) { // Headers has token
      await authentication.authenticate(token)
      
      if (authentication.isAuthenticated) {
        // TODO List of options
        return new Response(JSON.stringify(authentication.user), { status: 200 })
      } else {
        return new Response("Unauthorized", { status: 401 })
      }

    } else { // Token is not provided
      return new Response("V4EX Coin", { status: 200 });
    }
  }
}
