import WebSocketServer from '../web-socket/web-socket-server.js'

import MiningTaskResource from './mining-task/mining-task-resource.js'


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

  // AVAILABLE this.getResource(MiningServer.MINING_TASK)
  async initialize() {
    await super.initialize()

    // Make available MiningTaskResource and actions available for requesting
    await this.setResource(MiningServer.MINING_TASK, MiningTaskResource, { sub: this.sub })
  }

}
