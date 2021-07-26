import WebSocketServer from '../web-socket/web-socket-server.js'

import MiningTaskResource from './mining-task/mining-task-resource.js'

// ============================================================================
// MiningServer
// Single mining task
// TODO Provide multi-tasks mining


export default class MiningServer extends WebSocketServer {

  // ==========================================================================
  // 

  // PROVIDE this.bindingName
  // Durable Object Binding name set in wrangler.toml
  get bindingName() {
    return 'MINING'
  }

  // ==========================================================================
  // 
  
  // PROVIDE this.routePrefix
  // Request route prefix e.g. '/example'
  get routePrefix() {
    return '/mining'
  }

  // AVAILABLE this.getResource(MiningTaskResource.NAME)
  async initialize() {
    await super.initialize()

    // Make available MiningTaskResource and actions available for requesting
    await this.setResource(MiningTaskResource.NAME, MiningTaskResource, { sub: this.sub })
  }

}
