
export default class Auth0UserProxy {
  static get TENANT_DOMAIN() {
    return process.env.AUTH0_TENANT_DOMAIN
  }

  constructor() {
  }

  // Helper function
  async #fetch(token, endpoint) {
    return await fetch(endpoint, {
      method: 'GET',
      headers: {
        authorization: "bearer " + token
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

  // Token define the User
  async user(token) {
    let response = await this.#fetch(token, Auth0UserProxyEndpoints.userInfo)

    return await this.#jsonReturn(response)
  }

}

class Auth0UserProxyEndpoints {
  static get urlPrefix() {
    return `https://${Auth0UserProxy.TENANT_DOMAIN}/`
  }

  static get userInfo() {
    return Auth0UserProxyEndpoints.urlPrefix + `userinfo`
  }

}
