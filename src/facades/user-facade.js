import Authentication from '../auth/authentication.js'
import Authorization from '../auth/authorization.js'

// ============================================================================
// Simplify Usage of User Related Functionalities

export default class UserFacade {

  // ==========================================================================
  //

  // PROVIDE this.authentication
  // PROVIDE this.authorization
  constructor(authentication, authorization) {
    this.authentication = authentication
    this.authorization = authorization
    
    if (!this.isAuthenticated) {
      throw new Error("Authentication MUST be happened before User Facade.")
    }
  }

  static async create(managementToken, userToken) {
    // Prepare
    const authentication = new Authentication(managementToken)
    const authorization = new Authorization(authentication, managementToken)
    // Construct
    await authentication.authenticate(userToken)
    const self = new UserFacade(authentication, authorization)
    if (self.isAuthenticated) {
      return self
    }

    return false
  }

  // ==========================================================================
  //

  // PROVIDE this.isAuthenticated
  get isAuthenticated() {
    return this.authentication.isAuthenticated
  }

  // PROVIDE this.user
  get user() {
    return this.authentication.user
  }

  // PROVIDE this.userId
  get userId() {
    return this.user.id
  }

  // ==========================================================================
  //

  async userRoles() {
    return await this.authorization.userRoles()
  }

  async isMiner() {
    return await this.authorization.isMiner()
  }

  async isBroker() {
    return await this.authorization.isBroker()
  }

  async isMinter() {
    return await this.authorization.isMinter()
  }

  async getBrokerName() {
    return await this.authorization.getBrokerName()
  }

  async getMinterName() {
    return await this.authorization.getMinterName()
  }

  // ==========================================================================
  //

  // FIXME This code SHOULD not be in Authorization
  isOwnerOf(ownable) {
    return this.authorization.isOwnerOf(ownable)
  }

  // ==========================================================================
  //

  // PROVIDE this.userToken
  get userToken() {
    return this.authentication.userToken
  }

}
