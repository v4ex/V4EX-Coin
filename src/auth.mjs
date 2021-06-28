// Authentication module
export default class Auth {
  constructor(sub) {
    this.sub = sub
    this.isAuthenticated = false
    this.auth0UserInfo = "https://v4ex.us.auth0.com/userinfo"
    this.accessToken = ""
    this.userInfo = {}
  }

  async auth(accessToken) {
    // Not yet authenticated
    if (!this.isAuthenticated) {
      this.accessToken = accessToken
    
      // Connect to Auth0 API to get userinfo
      let auth0Response = await fetch(this.auth0UserInfo, {
        method: 'GET',
        headers: {
          authorization: "bearer " + accessToken
        }
      })

      // Successful response
      if (auth0Response.status == 200) {
        this.isAuthenticated = true
        this.userInfo = await auth0Response.json()
      }
      // Unauthorized

    } else {
      // Already authenticated
      // Changed accessToken
      if (accessToken != this.accessToken) {
        this.isAuthenticated = false
        await this.auth(accessToken)
      }
    }
  }

}
