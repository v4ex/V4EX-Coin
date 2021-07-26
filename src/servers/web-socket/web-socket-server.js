// Durable Object with Web Socket and Auth features

import WebSocketSession from './web-socket-session.js'
import Resource from './resource.js'


// ============================================================================
// Sessions Manager

class SessionsManager {

  // PROVIDE this.allSessions
  // PROVIDE this.managedSessions
  // PROVIDE this.managedSessionsIndexes
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
// Web Socket Server implementation
// Cloudflare Workers Durable Object
// Handle multiple client sessions.
// Handle single resource CRUD.
// Handle multiple resources CRUD.
// TODO Rate limit

export default class WebSocketServer {

  // ==========================================================================
  // Constructor and Initialize

  // PROVIDE this.state
  // PROVIDE this.storage
  // PROVIDE this.env
  // PROVIDE this.sessionsManager
  // PROVIDE this.resourcesRegistry
  constructor(state, env) {
    // Durable Object
    this.state = state                // Durable Object state
    this.storage = this.state.storage // Durable Object Storage
    this.env = env                    // Durable Object env
    // Web Socket
    this.sessionsManager = new SessionsManager()

    // Resources Registry
    Object.defineProperty(this, 'resourcesRegistry', {
      value: new Map(),
      writable: false,
      enumerable: true,
      configurable: false
    })
  }

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
   * @param {*} broadcastMessage
   * @param {*} broadcastPermissions
   * @returns {Promise}
   */
  async actionRoutes(session, resource, action, payload, responseMessage, broadcastMessage, broadcastPermissions) {
    const resourceActionClass = resource.actionsList.get(action)
    const resourceAction = new resourceActionClass(this, session, resource, action, payload, responseMessage, broadcastMessage, broadcastPermissions)
    await resourceAction.react()
  }

  // ==========================================================================
  // 

  // PROVIDE this.method
  get method() {
    return this.request.method
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

    this[resourceSymbol] = await Resource.create(resourceClass, init, this.storage, key)
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

    const resourcesIterator = this.resourcesRegistry.keys()
    let resource = resourcesIterator.next()
    while (!resource.done) {
      const key = resource.value
      if (this.url.pathname === `/${key}`) {
        switch (this.method) {
          case 'GET': {
            const responseValue = await this.storage.get(key)
            return new Response(JSON.stringify(responseValue), { status: 200 })

            break
          }
          case 'PUT': {
            await this.storage.put(key, await this.request.json())
            return new Response("OK", { status: 200 })

            break
          }
        }
      }
    
      // Move to next
      resource = resourcesIterator.next()
    }

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

      default:
        return new Response("Not Found", { status: 404 })
    }
  }
}
