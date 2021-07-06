import Api from './api.js'


export default class Error extends Api {

  static async captureError(env, error) {
    let id = env.ERROR.idFromName('V4EX')
    let stub = await env.ERROR.get(id)

    let request = new Request('/this/capture', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          "message": error.message,
          "stack": error.stack,
        }
      })
    })

    await stub.fetch(request)
  }

  // async externalBroadcast(message) {
  //   this.broadcast(message)
  // }

  async initialize() {
    await super.initialize()

    this.bindingName = 'ERROR'
    this.routePrefix = '/error'

    this.userRoles = []

  }

  async actionRoutes(action, payload, responseMessage) {

    switch (action) {
      case 'DEFAULT': {
        // 200 "OK"
        responseMessage.setStatus(200)
        break
      }
      default: {
        // Logging
        console.log(this.sub, " is trying unknown " + action.toString())
        // 501 "Not Implemented"
        responseMessage.setStatus(501)
      }
    }

    return responseMessage
  }

  async fetch(request) {
    //
    this.request = request

    // Make sure we're fully initialized from storage.
    if (!this.initializePromise) {
      this.initializePromise = this.initialize().catch((err) => {
        // If anything throws during initialization then we need to be
        // sure sure that a future request will retry initialize().
        // Note that the concurrency involved in resetting this shared
        // promise on an error can be tricky to get right -- we don't
        // recommend customizing it.
        this.initializePromise = undefined;
        throw err
      });
    }
    await this.initializePromise;

    // Apply requested action.
    let url = new URL(request.url)

    switch (url.pathname) {
      case this.routePrefix: {
        if (request.headers.get('Upgrade') === 'websocket') {
          const [client, server] = Object.values(new WebSocketPair())

          await this.handleSession(server)
  
          return new Response(null, { status: 101, webSocket: client })
        } else {

          return new Response("WebSocket expected", { status: 400 })
        }
      }

      case this.routePrefix + '/sessions': {
        return new Response(JSON.stringify(this.sessions), { status: 200 })
      }

      case '/this/capture': {

        // console.debug('Requesting /error/capture')

        let requestJson = await request.json()
        // console.debug(requestJson)

        let data = requestJson.data

        this.broadcast(data)

        return new Response("OK", { status: 200 })
      }

      default:
        return new Response('Not found', { status: 404 })
    }
  }

}
