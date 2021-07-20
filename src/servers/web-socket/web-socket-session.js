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
// WebSocket Session

export default class WebSocketSession {

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

  /**
   * Broadcast message.
   * 
   * @param {object} message 
   */
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
