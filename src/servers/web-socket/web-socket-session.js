import _ from 'lodash'
import Authentication from '../../auth/authentication.js'
import Authorization from '../../auth/authorization.js'
import UserFacade from '../../facades/user-facade.js';

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
// WebSocket Session

export default class WebSocketSession {

  // ==========================================================================
  // 

  #managementToken

  // PROVIDE this.authentication
  // PROVIDE this.authorization
  // PROVIDE this.id
  // PROVIDE this.ipAddress
  // PROVIDE this.managementToken
  // PROVIDE this.request
  // PROVIDE this.sessionsManager
  // PROVIDE this.userFacade
  // PROVIDE this.webSocket
  // PROVIDE this.webSocketServer
  // PROVIDE this.watch
  constructor(webSocketServer, webSocket, request, managementToken) {
    this.webSocketServer = webSocketServer
    this.sessionsManager = webSocketServer.sessionsManager
    this.ipAddress = request.headers.get("CF-Connecting-IP")
    this.id = Symbol(this.ipAddress) // Unique even ipAddress is the same.
    this.webSocket = webSocket
    this.request = request
    this.#managementToken = managementToken
    this.authentication = new Authentication(managementToken)
    this.authorization = new Authorization(this.authentication, managementToken)
    this.userFacade = undefined
    this.watch = false
    
    //
    this.webSocket.accept()

    this.addToSessionsManager()

    // LINK this.messageHandler
    this.webSocket.addEventListener('message', this.messageHandler.bind(this))

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

  // ==========================================================================
  // 

  // AVAILABLE this.userId If successfully authenticated
  // ENV DEV
  // CHANGE this.userFacade
  // CHANGE this.userToken
  // CHANGE this.watch
  // PROVIDE this.userToken
  async messageHandler({data}) {

    // Default response message
    const responseMessage = new ResponseMessage()
    const broadcastMessage = {}
    const broadcastPermissions = new Map()

    // TODO Separate Resource Action and Non-resource Action (Server Action)
    try {
      // Extract data from incoming message
      // token: User access token
      // resource: Target resource key string
      // action: Action to target resource
      // payload: Additional payload
      // watch: If accepting broadcast messages
      const { token, resource: resourceName, action, payload, watch } = JSON.parse(data)

      // Mark watch
      this.watch = watch

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
      if (this.userToken !== token && this.authentication.isAuthenticated) {
        this.authentication = new Authentication(this.#managementToken)
      }

      // Authentication
      if (!this.authentication.isAuthenticated) {
        this.userToken = token
        await this.authentication.authenticate(token)
      }
      
      const user = this.authentication.user
      if (user && user.isValid) {
        this.userId = user.id
        this.userFacade = new UserFacade(this.authentication, this.authorization)
      } else {
        this.userId = undefined
        this.userFacade = undefined
      }
      this.refreshSessionState()

      // HOOK this.actionRoutes
      // CHANGE responseMessage
      // CHANGE broadcastMessage
      // CHANGE broadcastPermissions
      await this.webSocketServer.actionRoutes(this, resource, action, payload, responseMessage, broadcastMessage, broadcastPermissions)

    } catch (error) {
      // Error
      console.error("Error caught processing income message: ", error.message);
      console.error(error.stack);

      if (responseMessage.status <= 500) {
        if (process.env.DEV) {
          responseMessage.setStatus(500, JSON.stringify({
            message: error.message,
            stack: error.stack
          })) // "Internal Server Error"
        } else {
          responseMessage.setStatus(500) // "Internal Server Error"
        }
      }

    } finally { // Finally send the constructed response to client.
      // Respond the requesting client
      this.respond(responseMessage)
      // Broadcast message to watchers
      this.broadcast(broadcastMessage, broadcastPermissions, resource)
    }

  }

  // ==========================================================================
  // 

  respond(message) {
    this.webSocket.send(JSON.stringify(message))
  }

  // TODO Permissions Management
  /**
   * Broadcast message.
   * 
   * @param {object} message
   * @param {Map} permissions
   * @param {Resource} resource
   */
  broadcast(message, permissions, resource) {
    if (_.isEmpty(message)) {
      return
    }

    if (this.userId) {
      // Broadcast to all watching users
      const usersIdIterator = this.sessionsManager.managedSessions.keys()
      let userIdItem = usersIdIterator.next()
      while(!userIdItem.done) {
        const userId = userIdItem.value
        const userSessions = this.sessionsManager.getUserSessions(userId)

        userSessions.forEach(async (sessionId) => {
          const session = this.sessionsManager.getSession(sessionId)
          if (!session.watch) {
            return
          }
          const broadcastPermissionsHandler = permissions.get('handler')
          if (broadcastPermissionsHandler) {
            if (await broadcastPermissionsHandler(session)) {
              session.webSocket.send(JSON.stringify(message))
            }
          } else {
            session.webSocket.send(JSON.stringify(message))
          }
        })

        // Move to next
        userIdItem = usersIdIterator.next()
      }
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
