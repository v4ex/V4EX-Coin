// Durable Object with Web Socket and Auth features

import AuthService from './auth.js'

import Status from 'http-status'
import { getReasonPhrase } from 'http-status-codes';
Status.getReasonPhrase = getReasonPhrase


// Cloudflare Workers Durable Object
// Serving API for Server
/**
 * @property {AuthService} Auth
 * @property {Request} Request Web request
 * @property {Url} Url Web request URL
 */
export default class DurableObjectWebSocketAuth {

  // ==========================================================================
  // Customization

  // Override initialize() to set them.
  bindingName    // Binding name setted in wrangler.toml
  routePrefix    // Request route prefix e.g. '/example'
  userRoles = [] // User roles

  // Override to handle web socket messages
  async actionRoutes(action, payload) {
    switch (action) {
      case 'DEFAULT': {
        // 200 "OK"
        this.Response.setStatus(200)
        break
      }
      default: {
        console.log(this.sub, " is trying unknown " + action.toString())
        // 400 "Bad Request"
        this.Response.setStatus(400)
      }
    }
  }

  // ==========================================================================
  // Constructor and Initialize

  constructor(state, env){
    // Durable Object
    this.state = state                // Durable Object state
    this.Storage = this.state.storage // Durable Object Storage
    this.env = env                    // Durable Object env
    // Web Socket
    this.sessions = [] // Web socket sessions
    // Web request
    this.request // Web request
    this.url     // Web request URL
    // Web Response
    this.Response = {
      server: 'V4EX',
      status: 200,
      statusName: Status['200_NAME'],
      statusReason: Status.getReasonPhrase(200),
      statusMessage: Status['200_MESSAGE'],
      payload: {}
    }
    this.Response.setStatus = status => {
      this.Response.status = status
      this.Response.statusName = Status[`${status}_NAME`]
      this.Response.statusReason = Status.getReasonPhrase(status),
      this.Response.statusMessage = Status[`${status}_MESSAGE`]
    }
    // Authentication
    this.sub = 'V4EX' // User sub
    this.Auth         // Auth service
    this.pass = false // message passage status
  }

  // Before calling this, this.request is ready.
  async initialize() {
    // Initialize Auth service and requirements
    this.url = new URL(this.request.url)
    this.sub = this.url.searchParams.get('sub') ?? this.sub
    this.Auth = new AuthService(this.sub, this.env)
  }

  // ==========================================================================
  // Authentication

  // Get userinfo from authenticated Auth0 user
  async auth(accessToken) {
    await this.Auth.auth(accessToken)

    // Equal pass value AuthServie authentication status
    // And check roles
    this.pass = this.Auth.isAuthenticated() && (this.userRoles.length === 0 || this.Auth.hasRoles(this.userRoles))

    // DEBUG
    // console.log(this.Auth.userInfo())

    // Successful authenticated
    if (this.pass) {
      // Check Integrity of Durable Object
      // This Durable Object is creating with sub as name to generate fixed Id
      if (this.state.id.toString() != this.env[this.bindingName].idFromName(this.Auth.userInfo().sub).toString()) {
        // DEBUG
        // console.log("Checking Durable Object integrity.")
        this.pass = false
      }
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
      try {
        // Extract data from client message
        const { accessToken, action, payload } = JSON.parse(data)
        // DEBUG
        // console.log("accessToken: ", accessToken)
        // console.log("action: ", action)
        // console.log("payload: ", payload)

        // Authentication
        await this.auth(accessToken)

        // Disallow
        if (!this.pass) {
          if (this.Response.status < 300) {
            // 401 'Unauthorized'
            this.Response.setStatus(401)
          }
        } else { // Allow
          // ActionRoutes callback
          await this.actionRoutes(action, payload)
        }
      } catch (error) {
        // Error
        console.error("Error caught processing income message: ", error.message);
        console.error(error.stack);

        // DEBUG
        // webSocket.send("Error.")

        if (this.Response.status <= 500) {
          // 500 "Internal Server Error"
          this.Response.setStatus(500)
        }
      } finally { // Finally send the constructed response to client.
        // DEBUG
        // webSocket.send("Cloudflare Workers")
        // webSocket.send(JSON.stringify(this.Auth.userInfo))

        webSocket.send(JSON.stringify(this.Response))
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
