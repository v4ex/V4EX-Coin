import AuthService from './auth.js'
import MiningTask from './mining-task.js'

import Status from 'http-status'
import { getReasonPhrase } from 'http-status-codes';
Status.getReasonPhrase = getReasonPhrase

// Cloudflare Workers Durable Object
// Runtime API https://developers.cloudflare.com/workers/runtime-apis/durable-objects
export default class Miner {
  // Predefined stored value keys
  static MINING_TASK = 'mining-task'

  // ==========================================================================
  // 
  
  //
  constructor(state, env){
    this.state = state // Durable Object state
    this.Storage = this.state.storage // Durable Object Storage
    this.env = env // Durable Object env
    //
    this.sessions = [] // Web socket sessions
    this.request = {} // Web request
    this.Url = {} // Web request URL
    //
    this.sub = 'V4EX' // User sub
    /**
     * @type {AuthService}
     */
    this.Auth = {} // Auth service
    this.pass = false // message passage status
    //
    this.miningTasks = [] // List of mining tasks
    /**
     * @type {MiningTask}
     */
    this.miningTask // The current mining task
  }

  // Before calling this, this.request is ready.
  async initialize() {
    // Initialize Auth service and requirements
    this.Url = new URL(this.request.url)
    this.sub = this.Url.searchParams.get('sub') ?? this.sub
    this.Auth = new AuthService(this.sub)

    // Try to initialize the mining task
    let storedMiningTask = await this.Storage.get(Miner.MINING_TASK)
    this.miningTask = new MiningTask(storedMiningTask ?? { sub: this.sub }, this.Storage)
  }

  // Get userinfo from authenticated Auth0 user
  async auth(accessToken) {
    await this.Auth.auth(accessToken)

    // Equal pass value AuthServie authentication status
    this.pass = this.Auth.isAuthenticated

    // Successful authenticated
    if (this.pass) {
      // Check Integrity of Durable Object
      if (this.state.id.toString() != this.env.MINER.idFromName(this.Auth.userInfo.sub).toString()) {
        this.pass = false
      }
    }
  }

  // ==========================================================================
  // 

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
      // Prepare response
      const response = {
        server: 'V4EX',
        status: 200,
        statusName: Status['200_NAME'],
        statusReason: Status.getReasonPhrase(200),
        statusMessage: Status['200_MESSAGE'],
        // reason: '',
        // description: '',
        payload: {}
      }
      response.setStatus = status => {
        response.status = status
        response.statusName = Status[`${status}_NAME`]
        response.statusReason = Status.getReasonPhrase(status),
        response.statusMessage = Status[`${status}_MESSAGE`]
      }

      try {
        // Extract data from client message
        const { accessToken, action, payload } = JSON.parse(data)
        // DEBUG
        // console.log("accessToken: ", accessToken)
        // console.log("action: ", action)
        // console.log("payload: ", payload)

        // Authentication
        await this.auth(accessToken)

        
        // Passed message
        if (!this.pass) {
          // DEBUG
          // webSocket.send('Unauthorized')
          // DEBUG
          // console.log("Durable Object id: ", this.state.id.toString())
          // if ('sub' in this.Auth.userInfo) {
          //   console.log("Durable Object id from user sub: ", this.env.MINER.idFromName(this.Auth.userInfo.sub).toString())
          // }
          if (response.status < 300) {
            // 401 'Unauthorized'
            response.setStatus(401)
          }
        } else {
          // Actions route
          switch (action) {
            case 'INITIALIZE': {
              // Before interexchanging messages, this.miningTask value has been initialized from DO storage or by code
              // Miner can only initialize a mining task if there is none in proceeding
              if (!this.miningTask.isInitialized()) {
                this.miningTask.initialize()
                await this.miningTask.save()

                // 201 'Created'
                response.setStatus(201)
              }
              else {
                // Mining task has been initialized
                // 304 "Not Modified"
                response.setStatus(304)
              }
              // DEBUG
              // console.log(`this.miningTask ${typeof this.miningTask} is: `, this.miningTask)

              // Add data to payload
              response.payload.miningTask = this.miningTask

              break
            }
            //
            case 'VIEW': {
              response.payload.miningTask = await this.Storage.get(Miner.MINING_TASK)

              break
            }
            case 'SUBMIT': {
              if (!this.miningTask.isSubmitted()) {
                let submitted = await this.miningTask.submit(payload.work)                
                if (submitted) {
                  // 201 'Created'
                  response.setStatus(201)
                } else {
                  // 400 "Bad request"
                  response.setStatus(400)
                }
              } else { // Already submitted
                // 304 "Not Modified"
                response.setStatus(304)
              }

              // Attach payload
              if (response.status < 400) {
                response.payload.miningTask = this.miningTask
              }

              break
            }
            case 'RESUBMIT': {
              if (this.miningTask.isSubmitted()) {
                let submitted = await this.miningTask.submit(payload.work)                
                if (submitted) {
                  // 200 'OK'
                  response.setStatus(200)
                } else {
                  // 400 "Bad request"
                  response.setStatus(400)
                }
              } else { // Not yet submitted
                // 400 "Bad request"
                response.setStatus(400)
              }

              // Attach payload
              if (response.status < 400) {
                response.payload.miningTask = this.miningTask
              }

              break
            }
            // DEBUG
            // case 'SAVE': {
            //   await this.miningTask.save()
            //   response.payload.miningTask = this.miningTask
            //   // DEBUG
            //   console.log("Mining task in storage: ", await this.Storage.get(Miner.MINING_TASK))

            //   break
            // }
            // DEBUG
            case 'DESTROY': { // SHOULD only allow in Admin
              await this.miningTask.destroy()
              this.miningTask = new MiningTask({ sub: this.sub }, this.Storage)

              break
            }
            default: {
              // DEBUG
              // webSocket.send('Unknown API request.')
              // LOG
              console.log(this.sub, " is trying unknown " + action.toString())

              // 400 "Bad Request"
              response.setStatus(400)
            }
          }
        }
      } catch (error) {
        // Error
        console.error("Error caught processing income message:", error.message);
        console.error(error.stack);

        // DEBUG
        // webSocket.send("Error.")

        if (response.status <= 500) {
          // 500 "Internal Server Error"
          response.setStatus(500)
        }
      } finally { // Finally send the constructed response to client.
        // DEBUG
        // webSocket.send("Cloudflare Workers")
        // webSocket.send(JSON.stringify(this.Auth.userInfo))

        webSocket.send(JSON.stringify(response))
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
      case '/mining': {
        if (request.headers.get('Upgrade') === 'websocket') {
          const [client, server] = Object.values(new WebSocketPair())

          await this.handleSession(server)
  
          return new Response(null, { status: 101, webSocket: client })
        } else {

          return new Response("WebSocket expected", { status: 400 })
        }
      }

      case '/mining/sessions': {
        return new Response(JSON.stringify(this.sessions), { status: 200 })
      }

      case '/mining/request': {
        return new Response(JSON.stringify(request), { status: 200 })
      }

      default:
        return new Response('Not found', { status: 404 })
    }
  }
}
