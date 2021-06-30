import * as _ from 'lodash'

// Authentication module
export default class Auth {
  #auth0Endpoints = {
    userInfo: 'https://v4ex.us.auth0.com/userinfo'
  }
  #sub
  #env
  #accessToken
  #isAuthenticated = false
  #userInfo = {
    roles: []
  }
  #userRoles = []

  constructor(sub, env) {
    this.#sub = sub
    this.#env = env
    this.#auth0Endpoints.userRoles = () => {
      return `https://v4ex.us.auth0.com/api/v2/users/${encodeURIComponent(this.#sub)}/roles`
    }
  }

  async auth(accessToken) {
    // Not yet authenticated
    if (!this.#isAuthenticated) {
      this.#accessToken = accessToken
    
      // Connect to Auth0 API to get userinfo
      let response = await fetch(this.#auth0Endpoints.userInfo, {
        method: 'GET',
        headers: {
          authorization: "bearer " + accessToken
        }
      })

      // Successful response
      if (response.status == 200) {
        this.#userInfo = _.merge(await response.json(), this.#userInfo)
        // Check sub integrity
        if (this.#userInfo.sub === this.#sub) {
          this.#isAuthenticated = true
        }
        // After authentication
        if (this.#isAuthenticated) {
          // Use Management API to get user roles.
          await this.fetchUserRoles()
        }
      }
      // Unauthorized

    } else {
      // Already authenticated
      // Changed accessToken
      if (accessToken != this.#accessToken) {
        this.#isAuthenticated = false
        await this.auth(accessToken)
      }
    }
  }

  async fetchUserRoles() {
    // Only procceed if user is already authenticated
    if (!this.#isAuthenticated) {
      return
    }

    // Connect to Auth0 API to get user roles
    let response = await fetch(this.#auth0Endpoints.userRoles(), {
      method: 'GET',
      headers: {
        authorization: "bearer " + this.#env.AUTH0_ACCESS_TOKEN
      }
    })

    // Successful response
    if (response.status == 200) {
      this.#userRoles = await response.json()
      // Check roles
      if (_.find(this.#userRoles, { id: this.#env.AUTH0_MINER_ROLE_ID })) {
        this.#userInfo.roles.push('miner')
      }
      if (_.find(this.#userRoles, { id: this.#env.AUTH0_MINTER_ROLE_ID })) {
        this.#userInfo.roles.push('minter')
      }
    }
    // Unauthorized
    
  }

  isAuthenticated() {
    return this.#isAuthenticated
  }

  userInfo() {
    return this.#userInfo
  }

  isMiner() {
    return this.#userInfo.roles.includes('miner')
  }

  isMinter() {
    return this.#userInfo.roles.includes('minter')
  }

}
