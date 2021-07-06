// Durable Object with Web Socket and Auth features

import AuthService from '../services/auth-service.js'

import Status from 'http-status'
import { getReasonPhrase } from 'http-status-codes';
Status.getReasonPhrase = getReasonPhrase

import ErrorApi from './error.js'
// BUG
// import DebugApi from './debug.js'

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
// Base API class
// Cloudflare Workers Durable Object
// Web Socket

/**
 * @property {AuthService} authService
 * @property {Request} Request Web request
 * @property {Url} Url Web request URL
 */
export default class Api {

  // ==========================================================================
  // Customization

  // Override initialize() to set them.
  bindingName    // Binding name setted in wrangler.toml
  routePrefix    // Request route prefix e.g. '/example'
  userRoles = [] // User roles

  /**
   * Override this method to handle web socket messages
   * 
   * @param {String} action 
   * @param {*} payload 
   * @param {ResponseMessage} responseMessage 
   * @returns 
   */
  async actionRoutes(action, payload, responseMessage) {
    switch (action) {
      case 'DEFAULT': {
        // 200 "OK"
        responseMessage.setStatus(200)
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

  // ==========================================================================
  // Constructor and Initialize

  constructor(state, env) {
    // Durable Object
    this.State = state                // Durable Object state
    this.Storage = this.State.storage // Durable Object Storage
    this.Env = env                    // Durable Object env
    // Web Socket
    this.sessions = [] // Web socket sessions
    // Web request
    this.request // Web request
    this.url     // Web request URL
    // Authentication
    this.subscriber = 'V4EX' // User sub
    this.authService         // Auth service
    this.pass = false // message passage status
  }

  // Before calling this, this.request is ready.
  async initialize() {
    // Initialize Auth service and requirements
    this.url = new URL(this.request.url)
    // DEPRECATED Get user sub by AuthService instead.
    // this.sub = this.url.searchParams.get('sub') ?? this.sub
    this.authService = new AuthService(this.Env)
  }

  // ==========================================================================
  // Authentication

  // Get userinfo from authenticated Auth0 user
  async auth(accessToken) {
    try {
      await this.authService.auth(accessToken)

      // Equal pass value AuthServie authentication status
      // And check roles
      this.pass = this.authService.isAuthenticated() && (this.userRoles.length === 0 || this.authService.hasRoles(this.userRoles))

      // DEBUG
      // console.debug(this.Auth.userInfo())

      // Successful authenticated
      if (this.pass) {
        // Assign user sub
        this.subscriber = this.authService.userInfo().sub

        // Check Integrity of Durable Object
        // This Durable Object is creating with sub as name to generate fixed Id
        if (this.State.id.toString() != this.Env[this.bindingName].idFromName(this.subscriber).toString()) {
          // DEBUG
          // console.debug("Checking Durable Object integrity.")
          this.pass = false
        }
      }
    } catch (error) {
      await ErrorApi.captureError(this.Env, error)
      // DebugApi.wsBroadcast(this.Env, "Debugging in Api::auth()")
      // DebugApi.wsBroadcast(this.Env, error)

      console.error("Authentication error: ", error.message);
      console.error(error.stack);
      
      // DEBUG
      // this.broadcast("Can not print errors to console.")
    }
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
    let session = { webSocket }
    this.sessions.push(session)

    // Handle 'message' event
    webSocket.addEventListener('message', async ({ data }) => {
      // Default response message
      let responseMessage = new ResponseMessage()

      // DEBUG
      // console.debug(responseMessage)

      try {
        // Extract data from client message
        const { token: accessToken, action, payload } = JSON.parse(data)
        // DEBUG
        // console.debug("accessToken: ", accessToken)
        // console.debug("action: ", action)
        // console.debug("payload: ", payload)

        // Authentication
        await this.auth(accessToken)

        // Disallow
        if (!this.pass) {
          if (responseMessage.status < 400) {
            // 401 'Unauthorized'
            responseMessage.setStatus(401)
          }
        } else { // Allow
          // ActionRoutes callback
          responseMessage = await this.actionRoutes(action.toString(), payload, responseMessage)
        }
      } catch (error) {
        // Error
        console.error("Error caught processing income message: ", error.message);
        console.error(error.stack);

        if (responseMessage.status <= 500) {
          // 500 "Internal Server Error"
          responseMessage.setStatus(500)
        }
      } finally { // Finally send the constructed response to client.
        // DEBUG
        // console.debug(responseMessage)
        this.broadcast(responseMessage)
      }
    })

    webSocket.addEventListener('close', () => {
      this.clearSession(session, webSocket)
    })

    webSocket.addEventListener('error', () => {
      this.clearSession(session, webSocket)
    })
  }

  // ==========================================================================
  // 

  // async debug(data) {
  //   DebugApi.wsBroadcast(this.Env, data)
  // }

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

      default:
        return new Response('Not found', { status: 404 })
    }
  }
}
