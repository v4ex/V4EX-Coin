import Auth0Proxy from "../proxies/auth0-proxy.js"
import Auth0UserProxy from "../proxies/auth0-user-proxy.js"

import Jwt from '../utilities/jwt-rs256.js';

import { User } from '../models/user.js'


// ============================================================================
// .env
//
// AUTH0_JWK
// AUTH0_CLIENTS


// ============================================================================
// 

export default class AuthenticationService {
  #auth0Proxy
  #auth0UserProxy

  #isAuthenticated
  #user

  /**
   * 
   * @param {string} managementToken Management API token
   */
  constructor(managementToken) {
    this.#auth0Proxy = new Auth0Proxy(managementToken)
    this.#auth0UserProxy = new Auth0UserProxy()
  }

  /**
   * TODO Handle errors
   * 
   * 
   * @param {string} token User token
   * @returns 
   * 
   * 1. Auth0 Authentication Token
   * 2. Auth0 (JWT) JSON Web Token Token
   */
  async authenticate(token) {
    // Avoid double check
    if (this.#isAuthenticated) {
      return
    }

    if (!token) {
      throw new Error("Invalid token.")
    }

    if (token.length === 32) { // Auth0 Authentication Token
      const userInfo = await this.#auth0UserProxy.user(token)
      if (userInfo) {
        const userInfo2 = await this.#auth0Proxy.user(userInfo.sub)
        if (userInfo2) {
          this.#isAuthenticated = true
          this.#user = new User(userInfo2)
        }
      }
    } else if (token.length > 32) { // Auth0 (JWT) JSON Web Token Token
      const clientId = await Jwt.validate(token, JSON.parse(process.env.AUTH0_JWK))
      const userId = JSON.parse(process.env.AUTH0_CLIENTS)[clientId]
      if (userId) {
        const userInfo = await this.#auth0Proxy.user(userId)
        if (userInfo) {
          this.#isAuthenticated = true
          this.#user = new User(userInfo)
        }
      }
    }
  }

  get isAuthenticated() {
    return this.#isAuthenticated
  }

  // Get the authenticated user
  // undefined if is not authenticated
  get user() {
    return this.#user
  }

}
