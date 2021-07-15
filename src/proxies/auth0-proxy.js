
export default class Auth0Proxy {
  // ENV AUTH0_TENANT_DOMAIN
  // PROVIDE Auth0Proxy.TENANT_DOMAIN
  static get TENANT_DOMAIN() {
    return process.env.AUTH0_TENANT_DOMAIN
  }

  #token

  constructor(token) {
    this.#token = token
  }

  // Helper function
  async #fetch(endpoint) {
    return await fetch(endpoint, {
      method: 'GET',
      headers: {
        authorization: "bearer " + this.#token
      }
    })
  }

  // Helper function
  async #jsonReturn(response) {
    if (response.status === 200) {
      let data = await response.json()
      return data
    }
    return undefined
  }

  async user(userId) {
    let response = await this.#fetch(Auth0ProxyEndpoints.userInfo(userId))

    return await this.#jsonReturn(response)
  }

  async userRoles(userId) {
    let response = await this.#fetch(Auth0ProxyEndpoints.userRoles(userId))

    return await this.#jsonReturn(response)
  }

}

class Auth0ProxyEndpoints {
  static get urlPrefix() {
    return `https://${Auth0Proxy.TENANT_DOMAIN}/api/v2/`
  }

  static userInfo(userId) {
    return Auth0ProxyEndpoints.urlPrefix + `users/${encodeURIComponent(userId)}`
  }

  static userRoles(userId) {
    return Auth0ProxyEndpoints.urlPrefix + `users/${encodeURIComponent(userId)}/roles`
  }

}
