import _ from '../utilities/index.js'
import Authentication from '../auth/authentication.js'
import Authorization from '../auth/authorization.js'
import Controller from './controller.js'


export default class AuthController extends Controller {

  // ==========================================================================
  // 

  // ENV AUTH0_MANAGEMENT_TOKEN
  // PROVIDE this.authentication
  // PROVIDE this.userToken
  async authenticate() {
    this.authentication = new Authentication(this.env.AUTH0_MANAGEMENT_TOKEN)
    this.userToken = _.getAuthorizationBearerFromRequest(this.request)

    if (this.userToken) { // Headers has token
      await this.authentication.authenticate(this.userToken)
      
      return this.authentication.isAuthenticated
    }
    throw new Error("User token is not provided.")
  }

  // ENV AUTH0_MANAGEMENT_TOKEN
  // PROVIDE this.authorization
  authorize () {
    this.authorization = new Authorization(this.authentication, this.env.AUTH0_MANAGEMENT_TOKEN)
  }

}
