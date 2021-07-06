import _ from '../utilities/index.js'

import Jwt from '../utilities/jwt-rs256.js';

import ErrorApi from '../api/error.js'

import DebugApi from '../api/debug.js'


class AuthenticationError extends Error {}

// Authentication module
export default class AuthService {
  // User roles
  static ROLE_MINER = 'miner'
  static ROLE_BROKER = 'broker'
  static ROLE_MINTER = 'minter'

  // Class private members
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
  #roles = [] // Array of role objects

  constructor(env) {
    this.#env = env
    this.#auth0Endpoints.userRoles = () => {
      return `https://v4ex.us.auth0.com/api/v2/users/${encodeURIComponent(this.#sub)}/roles`
    }
    this.#auth0Endpoints.userInfo2 = () => {
      return `https://v4ex.us.auth0.com/api/v2/users/${encodeURIComponent(this.#sub)}`
    }
  }

  async debug(data) {
    DebugApi.wsBroadcast(this.#env, data)
  }

  // IMPORTANT
  // Make sure prepare this.#userInfo, this.#sub if set this.#isAuthenticated to true
  async auth(accessToken) {

    // console.debug("AuthService.auth()")
    // this.#sendToError("AuthService.auth()")
    await this.debug("AuthService.auth()")

    // Not yet authenticated
    if (!this.#isAuthenticated) {
      this.#accessToken = accessToken
    
      // Auth0 Authentication Token
      if (accessToken.length <= 32) {

        console.debug("Auth0 Authentication API")

        // Connect to Auth0 Authentication API to get userinfo
        let userInfoResponse = await fetch(this.#auth0Endpoints.userInfo, {
          method: 'GET',
          headers: {
            authorization: "bearer " + accessToken
          }
        })

        // Successful response
        if (userInfoResponse.status == 200) {
          let userInfo = await userInfoResponse.json()
          
          // DEBUG
          // console.debug(userInfo)

          this.#userInfo = _.merge(userInfo, this.#userInfo)
          
          // DEPRECATED Get user sub from Auth0 instead
          // // Check sub integrity
          // if (this.#userInfo.sub === this.#sub) {
          //   this.#isAuthenticated = true
          // }
          if (this.#sub = this.#userInfo.sub) {
            this.#isAuthenticated = true
          }
        } else { // Unauthorized
          await ErrorApi.captureError(this.#env, Error("Throwing error for Failed to get user info."))

          throw new AuthenticationError("Failed to get user info.")
        }

      } else { // Assuming JWT
        // console.debug("Verify JWT.")

        let clientId = await Jwt.validate(this.#accessToken, JSON.parse(this.#env.AUTH0_JWK))

        if (clientId) {
          this.#sub = JSON.parse(this.#env.BROKERS)[clientId]

          // DebugApi.wsBroadcast(this.#env, {
          //   clientId,
          //   sub: this.#sub
          // })

          let userInfoResponse = await fetch(this.#auth0Endpoints.userInfo2(), {
            method: 'GET',
            headers: {
              authorization: "bearer " + this.#env.AUTH0_ACCESS_TOKEN
            }
          })

          if (userInfoResponse.status == 200) {
            let userInfo = await userInfoResponse.json()
            userInfo.sub = this.#sub

            this.#userInfo = _.merge(userInfo, this.#userInfo)
  
            this.#isAuthenticated = true
          } else {
            await ErrorApi.captureError(this.#env, Error("Throwing error for Failed to get user info."))
          }
        }
      }

      // After authentication
      if (this.#isAuthenticated) {
        // Use Management API to get user roles.
        await this.fetchUserRoles()
      }

    } else { // Already authenticated
      // Changed accessToken
      if (accessToken != this.#accessToken) {

        // DEBUG
        // console.debug("Changed accessToken.")

        this.#isAuthenticated = false
        await this.auth(accessToken)
      }
    }
  }

  async fetchUserRoles() {
    // Connect to Auth0 API to get user roles
    // TODO this.#env.AUTH0_ACCESS_TOKEN has expiration period
    let response = await fetch(this.#auth0Endpoints.userRoles(), {
      method: 'GET',
      headers: {
        authorization: "bearer " + this.#env.AUTH0_ACCESS_TOKEN
      }
    })

    // Successful response
    if (response.status == 200) {
      this.#roles = await response.json()
      // Check roles
      if (_.find(this.#roles, { id: this.#env.AUTH0_MINER_ROLE_ID })) {
        this.#userInfo.roles.push('miner')
      }
      if (_.find(this.#roles, { id: this.#env.AUTH0_BROKER_ROLE_ID })) {
        this.#userInfo.roles.push('broker')
      }
      if (_.find(this.#roles, { id: this.#env.AUTH0_MINTER_ROLE_ID })) {
        this.#userInfo.roles.push('minter')
      }
    } else { // Unauthorized
      await ErrorApi.captureError(this.#env, new Error("Throwing error for Failed to collect user roles information."))
      throw new AuthenticationError("Failed to collect user roles information.")
    }
    
  }

  isAuthenticated() {
    return this.#isAuthenticated
  }

  userInfo() {
    return this.#userInfo
  }


  // ==========================================================================
  // Roles

  isMiner() {
    return this.#userInfo.roles.includes(AuthService.ROLE_MINER)
  }

  isBroker() {
    return this.#userInfo.roles.includes(AuthService.ROLE_BROKER)
  }

  isMinter() {
    return this.#userInfo.roles.includes(AuthService.ROLE_MINTER)
  }

  // Check if user has roles
  hasRoles(roles) {
    return _.intersection(this.#userInfo.roles, roles).length > 0 ? true : false
  }

}
