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
// TODO Cache
// TODO Singleton
// TODO A way to refresh user info in case of changes.

export default class Authentication {
  #auth0Proxy
  #auth0UserProxy

  #isAuthenticated
  #user
  #userToken

  // PROVIDE this.#auth0Proxy
  // PROVIDE this.#auth0UserProxy
  /**
   * 
   * @param {string} managementToken Management API token
   */
  constructor(managementToken) {
    this.#auth0Proxy = new Auth0Proxy(managementToken)
    this.#auth0UserProxy = new Auth0UserProxy()
  }

  // AVAILABLE this.#user If successfully authenticated
  // AVAILABLE this.#userToken If successfully authenticated
  // CHANGE this.#isAuthenticated
  /**
   * TODO Handle errors
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
          userInfo2.id = userInfo2.user_id
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
          userInfo.id = userInfo.user_id
          this.#user = new User(userInfo)
        }
      }
    }

    if (this.#isAuthenticated) {
      this.#userToken = token
    }
  }

  // PROVIDE this.isAuthenticated
  get isAuthenticated() {
    return this.#isAuthenticated
  }

  // PROVIDE this.user
  // Get the authenticated user
  // undefined if is not authenticated
  get user() {
    return this.#user
  }

  // PROVIDE this.userToken
  get userToken() {
    return this.#userToken
  }

}
