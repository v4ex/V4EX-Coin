// import DevController from './controllers/dev-controller.js'

import RootController from './controllers/root-controller.js'
import SchemaController from './controllers/schema-controller.js'

import WebSocketController from './controllers/web-socket-controller.js'

// import Mining from './api/mining.js'
import Mining from './servers/mining/mining-server.js'

export {
  Mining
}


// Default Handler class of "modules" format
export default {
  async fetch(request, env) {

    // ========================================================================
    // Handle dev request

    // const { default: DevController } = await import('./controllers/dev-controller.js') // ERROR in Conflict: Multiple assets emit different content to the same filename worker.mjs.map
    // const devController = new DevController(request, env)
    // if (devController.canHandle) {
    //   return devController.handleRequest()
    // }

    // ========================================================================
    // Handle root request
    
    const indexController = new RootController(request, env)
    if (indexController.canHandle) {
      return indexController.handleRequest()
    }

    // ========================================================================
    // Handle Schema request

    const schemaController = new SchemaController(request, env)
    if (schemaController.canHandle) {
      return schemaController.handleRequest()
    }

    // ========================================================================
    // Durable Object Websocket

    // ?sub=${sub}
    // let sub = Url.searchParams.get('sub') ?? 'V4EX'

    const webSocketController = new WebSocketController(request, env)
    if (webSocketController.canHandle) {
      return webSocketController.handleRequest()
    }

    // ========================================================================
    // Fallback

    return new Response("Not Found", { status: 404 })

  }
}
