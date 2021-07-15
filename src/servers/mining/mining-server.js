import WebSocketServer from '../web-socket/web-socket-server.js'

import MiningTaskSource from './mining-task/mining-task-source.js'

import ViewAction from './mining-task/actions/view-action.js'
import InitializeAction from './mining-task/actions/initialize-action.js'
import SubmitAction from './mining-task/actions/submit-action.js'
import RejectAction from './mining-task/actions/reject-action.js'
import ResubmitAction from './mining-task/actions/resubmit-action.js'
import ResetAction from './mining-task/actions/reset-action.js'

import MinerMiningTaskResource from './mining-task/resources/miner-mining-task-resource.js'
import BrokerMiningTaskResource from './mining-task/resources/broker-mining-task-resource.js'
import MinterMiningTaskResource from './mining-task/resources/minter-mining-task-resource.js'


// Single mining task
// TODO Provide multi-tasks mining
export default class MiningServer extends WebSocketServer {

  // ==========================================================================
  // Register Sources and their keys

  // PROVIDE MiningServer.MINING_TASK
  static get MINING_TASK() {
    return 'MINING_TASK'
  }

  // ==========================================================================
  // 

  // PROVIDE this.bindingName
  // Durable Object Binding name set in wrangler.toml
  get bindingName() {
    return 'MINING'
  }

  
  // PROVIDE this.routePrefix
  // Request route prefix e.g. '/example'
  get routePrefix() {
    return '/mining'
  }

  // CHANGE this.miningTask
  async initialize() {
    await super.initialize()

    // Do them async if possible
    this.initializeMiningTask()
  }

  // PROVIDE this.miningTask
  async initializeMiningTask() {
    const storedMiningTask = await this.storage.get(MiningServer.MINING_TASK)
    // VULNERABILITY SHOULD Pass proxy storage instead of storage
    this.miningTaskSource = new MiningTaskSource(storedMiningTask ?? { sub: this.sub }, this.storage, MiningServer.MINING_TASK)
  }

  // TODO Connect actions to corresponding resources
  // CHANGE this.authenticationService
  // CHANGE this.miningTask
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
    // Prepare resource for action
    let resource
    if (this.sub === this.miningTaskSource.model.ownerId) {
      if (await this.authorizationService.isMiner()) {
        resource = new MinerMiningTaskResource(this.miningTaskSource)
      }
    } else {
      if (await this.authorizationService.isBroker()) {
        resource = new BrokerMiningTaskResource(this.miningTaskSource)
      } else if (await this.authorizationService.isMinter()) {
        resource = new MinterMiningTaskResource(this.miningTaskSource)
      }
    }

    switch (action) {
      case 'DEFAULT': {
        responseMessage.setStatus(200) // "OK"

        break
      }
      case 'VIEW': {
        const viewAction = new ViewAction(this, resource, user, payload, responseMessage)
        await viewAction.do()

        break
      }
      case 'INITIALIZE': {
        const initializeAction = new InitializeAction(this, resource, user, payload, responseMessage)
        await initializeAction.do()

        break
      }
      case 'SUBMIT': {
        const submitAction = new SubmitAction(this, resource, user, payload, responseMessage)
        await submitAction.do()

        break
      }
      case 'REJECT': {
        const rejectAction = new RejectAction(this, resource, user, payload, responseMessage)
        await rejectAction.do()

        break
      }
      case 'RESUBMIT': {
        const resubmitAction = new ResubmitAction(this, resource, user, payload, responseMessage)
        await resubmitAction.do()

        break
      }
      case 'RESET': {
        const resetAction = new ResetAction(this, resource, user, payload, responseMessage)
        await resetAction.do()

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
