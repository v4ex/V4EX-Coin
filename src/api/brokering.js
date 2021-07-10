import Api from './api.js'

import Mining from './mining.js'
import Debug from './debug.js'

import _ from '../utilities/index.js'

export default class Brokering extends Api {

  async initialize() {
    await super.initialize()

    this.bindingName = 'BROKERING'
    this.routePrefix = '/brokering'

    this.userRoles = ['broker']

  }

  async actionRoutes(action, payload, responseMessage, token) {
    switch (action) {
      // TODO
      case 'HELP': {
        // 501 "Not Implemented"
        responseMessage.setStatus(501)
        break
      }
      // IN_PROGRESS
      case 'VIEW': {
        // Input
        //   - user
        const { user } = payload
        
        let id = this.Env.MINING.idFromName(user)
        let stub = await this.Env.MINING.get(id)

        let miningTaskResponse = await stub.fetch(new Request(`/${Mining.MINING_TASK}`, {
          headers: {
            authorization: 'bearer ' + token
          }
        }))

        await Debug.wsBroadcast(this.Env, miningTaskResponse)

        if (miningTaskResponse.status == 200) {
          let miningTask = await miningTaskResponse.json()

          await Debug.wsBroadcast(this.Env, miningTask)

          if (!_.isEmpty(miningTask)) {
            responseMessage.setStatus(200) // "OK"
            responseMessage.payload.miningTask = miningTask
          }
        } else {
          responseMessage.setStatus(404) // "NOT FOUND"
        }

        break
      }
      // TODO
      case 'PROGRESS': {
        // 501 "Not Implemented"
        responseMessage.setStatus(501)
        break
      }
      // TODO
      case 'LIST': {
        // 501 "Not Implemented"
        responseMessage.setStatus(501)
        break
      }
      case 'DEFAULT': {
        // 200 "OK"
        responseMessage.setStatus(200)

        responseMessage.payload.userInfo = this.authService.userInfo()

        break
      }
      default: {
        // Logging
        console.warn(this.sub, " is trying unknown " + action.toString())
        // 501 "Not Implemented"
        responseMessage.setStatus(501, `Unknown action: ${action}`)
      }
    }

    return responseMessage
  }

}
