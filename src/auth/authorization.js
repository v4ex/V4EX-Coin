import _ from '../utilities/index.js'

import Authentication from './authentication.js'
import Auth0Proxy from '../proxies/auth0-proxy.js'
import { Ownable } from '../models/ownable.js'

// can
// cannot
// allow
// disallow

// Roles
// Permissions
//   - Owner only

// Authorize Route
// Authorize Route Message Action

// TODO hasRoles()
// TODO ACL
export default class Authorization {

  /**
   * @type {Authentication}
   */
  #authentication
  #auth0Proxy

  #cachedRoles
  #cachedRolesDate

  // PROVIDE this.#authentication
  // PROVIDE this.#auth0Proxy
  // PROVIDE this.#cache
  constructor(authentication, managementToken) {  
    this.#authentication = authentication
    this.#auth0Proxy = new Auth0Proxy(managementToken)

    
  }

  // ==========================================================================
  //

  throwIfNotAuthenticated() {
    if (!this.#authentication.isAuthenticated) {
      throw new Error("Authentication must happen before authorization.")
    }
  }

  /**
   * 
   * @param {Ownable} ownable
   */
  isOwnerOf(ownable) {
    this.throwIfNotAuthenticated()

    if (!(ownable instanceof Ownable) || ! ownable.isValid) {
      throw new Error("Target is not ownable.")
    }

    return ownable.ownerId === this.#authentication.user.id
  }

  // ENV AUTH0_ROLE_MINER
  async isMiner() {
    this.throwIfNotAuthenticated()

    const roleItems = await this.userRoles()

    for (const roleItem of roleItems) {
      if (roleItem.id === process.env.AUTH0_ROLE_MINER) {
        return true
      }
    }

    return false
  }

  // ENV AUTH0_ROLE_BROKER
  async isBroker() {
    this.throwIfNotAuthenticated()

    const roleItems = await this.userRoles()

    for (const roleItem of roleItems) {
      if (roleItem.id === process.env.AUTH0_ROLE_BROKER) {
        return true
      }
    }

    return false
  }

  // ENV AUTH0_ROLE_MINTER
  async isMinter() {
    this.throwIfNotAuthenticated()

    const roleItems = await this.userRoles()

    for (const roleItem of roleItems) {
      if (roleItem.id === process.env.AUTH0_ROLE_MINTER) {
        return true
      }
    }

    return false
  }

  // ==========================================================================
  //

  get userId() {
    return this.#authentication.user.id
  }

  // PROVIDE this.#cachedRoles
  // PROVIDE this.#cachedRolesDate
  // CHANGE this.#cachedRoles
  // CHANGE this.#cachedRolesDate
  async userRoles() {
    if (this.#cachedRolesDate && Date.now() > this.#cachedRolesDate) {
      return this.#cachedRoles
    }

    const roles = await this.#auth0Proxy.userRoles(this.userId)
    this.#cachedRoles = roles
    this.#cachedRolesDate = Date.now() // Same IO cache

    return roles
  }

}
