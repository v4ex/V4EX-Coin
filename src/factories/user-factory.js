import { User, UsersList } from '../models/user.js'
import Auth0Proxy from '../proxies/auth0-proxy.js'

export default class UserFactory {

  #auth0Proxy

  // PROVIDE this.#auth0Proxy
  constructor(token) {
    this.#auth0Proxy = new Auth0Proxy(token)
  }

  async getUser(userId) {
    const user = await this.#auth0Proxy.user(userId)

    if (user) {
      user.id = user.user_id
      return new User(user)
    }
    return undefined
  }

  async getUsersList(list = []) {
    const usersList = new UsersList()
    if (list.length > 0) {
      for (const userId of list) {
        const userModel = await this.getUser(userId)
        if (userModel) {
          usersList.add(userModel)
        }
      }
      return usersList
    }
    return undefined
  }
}
