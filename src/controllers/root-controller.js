import Controller from './controller.js'
import _ from '../utilities/index.js'
import AuthenticationService from '../services/authentication-service.js'


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
    const authenticationService = new AuthenticationService(managementToken)
    const token = _.getAuthorizationBearerFromRequest(request)

    if (token) { // Headers has token
      await authenticationService.authenticate(token)
      
      if (authenticationService.isAuthenticated) {
        // TODO List of options
        return new Response(JSON.stringify(authenticationService.user), { status: 200 })
      } else {
        return new Response("Unauthorized", { status: 401 })
      }

    } else { // Token is not provided
      return new Response("V4EX Coin", { status: 200 });
    }
  }
}
