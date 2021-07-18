// Durable Object with Web Socket and Auth features

import AuthenticationService from '../../services/authentication-service.js'
import AuthorizationService from '../../services/authorization-service.js'

import Status from 'http-status'
import { getReasonPhrase } from 'http-status-codes';
Status.getReasonPhrase = getReasonPhrase


// ============================================================================
// WebSocket Message

export class ResponseMessage {
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
// Sessions Manager

class SessionsManager {

  allSessions
  managedSessions
  managedSessionsIndexes

  constructor() {
    this.allSessions = new Map() // session.id -> session
    this.managedSessions = new Map() // userId -> Set()
    this.managedSessionsIndexes = new Map() // session.id -> userId
  }

  /**
   * @param {WebSocketSession} session 
   */
  addSession(session) {
    this.allSessions.set(session.id, session)
    // Try to manage session
    this.manageSession(session)
  }

  getSession(sessionId) {
    return this.allSessions.get(sessionId)
  }

  /**
   * @param {WebSocketSession} session 
   * @returns boolean
   */
  deleteSession(session) {
    this.unmanageSession(session)
    return this.allSessions.delete(session.id)
  }

  /**
   * Try to manage the session.
   * @param {WebSocketSession} session 
   */
  manageSession(session) {
    if (session.userId) {
      let userSessions = this.managedSessions.get(session.userId)
      if (!userSessions) {
        userSessions = new Set()
        this.managedSessions.set(session.userId, userSessions)
      }
      userSessions.add(session.id)
      this.managedSessionsIndexes.set(session.id, session.userId)
    }
  }

  unmanageSession(session) {
    const userId = this.managedSessionsIndexes.get(session.id)
    if (userId) {
      const userSessions = this.getUserSessions(userId)
      userSessions.delete(session.id)
      this.managedSessionsIndexes.delete(session.id)
    }
  }

  getUserSessions(userId) {
    return this.managedSessions.get(userId)
  }

}


// ============================================================================
// WebSocket Session

class WebSocketSession {

  constructor(webSocketServer, webSocket, request, managementToken) {
    this.webSocketServer = webSocketServer
    this.sessionsManager = webSocketServer.sessionsManager
    this.ipAddress = request.headers.get("CF-Connecting-IP")
    this.id = Symbol(this.ipAddress) // Unique even ipAddress is the same.
    this.webSocket = webSocket
    this.request = request
    this.managementToken = managementToken
    this.authenticationService = new AuthenticationService(managementToken)
    this.authorizationService = new AuthorizationService(this.authenticationService, managementToken)
    
    //
    this.webSocket.accept()

    this.addToSessionsManager()

    // AVAILABLE this.userId If successfully authenticated
    // CHANGE this.userToken
    // PROVIDE this.userToken
    this.webSocket.addEventListener('message', async ({data}) => {

      // Default response message
      let responseMessage = new ResponseMessage()

      try {
        // Extract data from incoming message
        // token: User access token
        // resource: Target resource key string
        // action: Action to target resource
        // payload: Additional payload
        const { token, resource: resourceName, action, payload } = JSON.parse(data)

        // Check the target resource
        const resource = this.webSocketServer.getResource(resourceName)
        if (resource === undefined) {
          throw new Error(`Unknown resource: ${resourceName}`)
        }

        // Check the specific action
        if (!resource.actionsList.has(action)) {
          throw new Error(`Unknown action(${action}) to resource(${resourceName})`)
        }

        // Check the user token
        if (this.userToken !== token && this.authenticationService.isAuthenticated) {
          this.authenticationService = new AuthenticationService(this.managementToken)
        }

        // Authentication
        if (!this.authenticationService.isAuthenticated) {
          this.userToken = token
          await this.authenticationService.authenticate(token)
        }
        
        const user = this.authenticationService.user
        if (user && user.isValid) {
          this.userId = user.id
        } else {
          this.userId = undefined
        }
        this.refreshSessionState()

        // HOOK this.actionRoutes
        // CHANGE responseMessage
        await this.webSocketServer.actionRoutes(this, resource, action, payload, responseMessage)

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

    // 
    // Handle Web Socket 'close' event
    this.webSocket.addEventListener('close', () => {
      this.deleteFromSessionsManager()
    })

    // Handle Web Socket 'error' event
    this.webSocket.addEventListener('error', () => {
      this.deleteFromSessionsManager()
    })

  }

  broadcast(message) {
    if (this.userId) {
      const userSessions = this.sessionsManager.getUserSessions(this.userId)

      userSessions.forEach(sessionId => {
        const session = this.sessionsManager.getSession(sessionId)
        session.webSocket.send(JSON.stringify(message))
      })
    } else {
      this.webSocket.send(JSON.stringify(message))
    }
  }

  addToSessionsManager() {
    this.sessionsManager.addSession(this)
  }

  deleteFromSessionsManager() {
    this.sessionsManager.deleteSession(this)
    this.webSocket.close(1011, "WebSocket closed.")
  }

  // Switch between Unmanaged and Managed
  refreshSessionState() {
    if (this.userId) {
      this.sessionsManager.manageSession(this)
    } else {
      this.sessionsManager.unmanageSession(this)
    }
  }

}

// ============================================================================
// Web Socket Server implementation
// Cloudflare Workers Durable Object
// Handle multiple client sessions.
// Handle single resource CRUD.
// Handle multiple resources CRUD.
// TODO Rate limit

export default class WebSocketServer {

  // ==========================================================================
  // Customization

  // PROVIDE this.bindingName
  // OVERRIDE
  // Durable Object Binding name set in wrangler.toml
  get bindingName() {
    return "WEB_SOCKET_SERVER"
  }

  // PROVIDE this.routePrefix
  // OVERRIDE
  // Request route prefix e.g. '/example'
  get routePrefix() {
    return "/web-socket"
  }

  // HOOK
  // OVERRIDE
  /**
   * Override this method to handle web socket messages
   * 
   * @param {WebSocketSession} session
   * @param {Resource} resource
   * @param {string} action
   * @param {*} payload 
   * @param {ResponseMessage} responseMessage
   * @returns {Promise}
   */
  async actionRoutes(session, resource, action, payload, responseMessage) {
    const resourceActionClass = resource.actionsList.get(action)
    const resourceAction = new resourceActionClass(this, session, resource, payload, responseMessage)
    await resourceAction.react()
  }

  // ==========================================================================
  // Constructor and Initialize

  // PROVIDE this.state
  // PROVIDE this.storage
  // PROVIDE this.env
  // PROVIDE this.sessionsManager
  constructor(state, env) {
    // Durable Object
    this.state = state                // Durable Object state
    this.storage = this.state.storage // Durable Object Storage
    this.env = env                    // Durable Object env
    // Web Socket
    this.sessionsManager = new SessionsManager()
    this.sessions = []

    // Resources Registry
    Object.defineProperty(this, 'resourcesRegistry', {
      value: new Map(),
      writable: false,
      enumerable: true,
      configurable: false
    })
  }

  // PROVIDE this.url
  // Available before initialize()
  get url() {
    return new URL(this.request.url)
  }

  // PROVIDE this.sub
  // Available before initialize()
  get sub() {
    return this.url.searchParams.get('sub')
  }

  // Before calling this, this.request is ready.
  // Make sure runtime data are initialized from durable object storage.
  // OVERRIDE
  async initialize() {
  }


  // ==========================================================================
  // Resources Registry

  // AVAILABLE this[this.resourcesRegistry.get(key)]
  /**
   * @param {*} key Key about to be used to find the Resource later.
   * @param {*} resourceClass The actual Resource class
   * @param {*} init Initialization object if there is no stored resource.
   */
  async setResource(key, resourceClass, init = {}) {
    const resourceSymbol = Symbol(key)
    this.resourcesRegistry.set(key, resourceSymbol)

    const storedResource = await this.storage.get(key)
    this[resourceSymbol] = new resourceClass(storedResource ?? init, this.storage, key)
  }

  getResource(key) {
    if (!this.resourcesRegistry.has(key)) {
      return undefined
    }

    return this[this.resourcesRegistry.get(key)]
  }


  // ==========================================================================
  // fetch

  // ENV AUTH0_MANAGEMENT_TOKEN
  // PROVIDE this.request
  async fetch(request) {
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

          new WebSocketSession(this, server, request, this.env.AUTH0_MANAGEMENT_TOKEN)

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
