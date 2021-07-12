import WebSocketServer from '../web-socket-server.js'

import MiningTask from './mining-task.js'

import ViewAction from './view-action.js'
import InitializeAction from './initialize-action.js'
import SubmitAction from './submit-action.js'
import ResubmitAction from './resubmit-action.js'
import ResetAction from './reset-action.js'


export default class MiningWebSocketServer extends WebSocketServer {

  // ==========================================================================
  // 

  static get MINING_TASK() {
    return 'mining-task'
  }

  // ==========================================================================
  // 

  // Durable Object Binding name set in wrangler.toml
  get bindingName() {
    return 'MINING'
  }

  // Request route prefix e.g. '/example'
  get routePrefix() {
    return '/mining'
  }

  async initialize() {
    await super.initialize()

    // Do them async if possible
    this.initializeMiningTask()
  }

  async initializeMiningTask() {
    const storedMiningTask = await this.storage.get(MiningWebSocketServer.MINING_TASK)
    // VULNERABILITY Pass proxied storage instead of storage
    this.miningTask = new MiningTask(storedMiningTask ?? { sub: this.sub }, this.storage)
  }

  /**
   * Override this method to handle web socket messages
   * 
   * @param {string} action 
   * @param {*} payload 
   * @param {ResponseMessage} responseMessage
   * @param {User} user
   * @returns 
   */
     async actionRoutes(user, action, payload, responseMessage) {
      switch (action) {
        case 'DEFAULT': {
          responseMessage.setStatus(200) // "OK"

          break
        }
        case 'VIEW': {
          const viewAction = new ViewAction(this, user, payload, responseMessage)
          await viewAction.do()

          break
        }
        case 'INITIALIZE': {
          const initializeAction = new InitializeAction(this, user, payload, responseMessage)
          await initializeAction.do()

          break
        }
        case 'SUBMIT': {
          const initializeAction = new SubmitAction(this, user, payload, responseMessage)
          await initializeAction.do()

          break
        }
        case 'RESUBMIT': {
          const initializeAction = new ResubmitAction(this, user, payload, responseMessage)
          await initializeAction.do()

          break
        }
        case 'RESET': {
          const initializeAction = new ResetAction(this, user, payload, responseMessage)
          await initializeAction.do()

          break
        }
        default: {
          // Logging
          console.warn("User is trying unknown action: " + action.toString())

          responseMessage.setStatus(501, `Unknown action: ${action}`) // "Not Implemented"
        }
      }
  
      return responseMessage
    }
}
