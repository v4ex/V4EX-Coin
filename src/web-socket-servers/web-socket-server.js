// Durable Object with Web Socket and Auth features

import AuthenticationService from '../services/authentication-service.js'

import Status from 'http-status'
import { getReasonPhrase } from 'http-status-codes';
Status.getReasonPhrase = getReasonPhrase


// ============================================================================
// WebSocket Message

class ResponseMessage {
  status = 200
  statusReason = Status.getReasonPhrase(200)
  statusMessage = Status[`200_MESSAGE`]
  payload = {}

  setStatus(status, message) {
    this.status = status
    this.statusReason = Status.getReasonPhrase(status)
    this.statusMessage = message ? message.toString() : Status[`${status}_MESSAGE`]
    // Reset payload when setting new status.
    this.payload = {}
  }
}

// ============================================================================
// Web Socket Server implementation
// Cloudflare Workers Durable Object
// Handle multiple client sessions.

export default class WebSocketServer {

  // ==========================================================================
  // Customization

  // Durable Object Binding name set in wrangler.toml
  get bindingName() {
    return "WEB_SOCKET_SERVER"
  }

  // Request route prefix e.g. '/example'
  get routePrefix() {
    return "/web-socket"
  }

  /**
   * Override this method to handle web socket messages
   * 
   * AVAILABLE this.authenticationService.user if authenticated
   * 
   * @param {User} user
   * @param {string} action 
   * @param {*} payload 
   * @param {ResponseMessage} responseMessage
   * @returns {Promise}
   */
  async actionRoutes(user, action, payload, responseMessage) {
    switch (action) {
      case 'DEFAULT': {
        // 200 "OK"
        responseMessage.setStatus(200)
        break
      }
      default: {
        // Logging
        console.warn("User is trying unknown action: " + action.toString())
        // 501 "Not Implemented"
        responseMessage.setStatus(501, `Unknown action: ${action}`)
      }
    }
  }

  // ==========================================================================
  // Constructor and Initialize

  // USING AUTH0_MANAGEMENT_TOKEN
  constructor(state, env) {
    // Durable Object
    this.state = state                // Durable Object state
    this.storage = this.state.storage // Durable Object Storage
    this.env = env                    // Durable Object env
    // Web Socket
    this.sessions = [] // Web socket sessions
    // Authentication
    this.authenticationService = new AuthenticationService(env.AUTH0_MANAGEMENT_TOKEN) // Authentication service
    // TODO Authorization

  }

  // Available before initialize()
  get url() {
    return new URL(this.request.url)
  }

  // Available before initialize()
  get sub() {
    return this.url.searchParams.get('sub')
  }

  // Before calling this, this.request is ready.
  // Make sure runtime data are initialized from durable object storage.
  async initialize() {
  }

  // ==========================================================================
  // Web Socket

  clearSession(session, webSocket) {
    this.sessions = this.sessions.filter((_session) => _session !== session)
    webSocket.close(1011, "WebSocket closed.")
  }

  broadcast(message) {
    this.sessions.forEach((session) => {
      session.webSocket.send(JSON.stringify(message))
    })
  }

  async handleSession(webSocket) {
    // New web socket
    webSocket.accept()
    const session = { webSocket }
    this.sessions.push(session)

    // Handle Web Socket 'message' event
    webSocket.addEventListener('message', async ({ data }) => {
      // Default response message
      let responseMessage = new ResponseMessage()

      try {
        // Extract data from incoming message
        const { token, action, payload } = JSON.parse(data)

        // Authentication
        if (!this.authenticationService.isAuthenticated) {
          await this.authenticationService.authenticate(token)
        }
        
        const user = this.authenticationService.user

        // Authenticated
        if (user) {
          // ActionRoutes callback
          await this.actionRoutes(user, action.toString(), payload, responseMessage)
        } else {
          responseMessage.setStatus(401) // Unauthorized
        }
      } catch (error) {
        // Error
        console.error("Error caught processing income message: ", error.message);
        console.error(error.stack);

        if (responseMessage.status <= 500) {
          responseMessage.setStatus(500) // "Internal Server Error"
        }

      } finally { // Finally send the constructed response to client.
        this.broadcast(responseMessage)
      }
    })

    // Handle Web Socket 'close' event
    webSocket.addEventListener('close', () => {
      this.clearSession(session, webSocket)
    })

    // Handle Web Socket 'error' event
    webSocket.addEventListener('error', () => {
      this.clearSession(session, webSocket)
    })
  }

  // ==========================================================================
  // 

  // PROVIDING this.request
  async fetch(request) {
    //
    this.request = request

    // Make sure we're fully initialized from storage.
    if (!this.initializePromise) {
      this.initializePromise = this.initialize().catch((error) => {
        this.initializePromise = undefined
        throw error
      })
    }
    await this.initializePromise

    switch (this.url.pathname) {
      case this.routePrefix: {
        if (request.headers.get('Upgrade') === 'websocket') {
          const [client, server] = Object.values(new WebSocketPair())
          await this.handleSession(server)
          return new Response(null, { status: 101, webSocket: client })
        } else {
          return new Response("WebSocket expected", { status: 400 })
        }
      }

      // case this.routePrefix + '/sessions': {
      //   return new Response(JSON.stringify(this.sessions), { status: 200 })
      // }

      default:
        return new Response("Not Found", { status: 404 })
    }
  }
}
