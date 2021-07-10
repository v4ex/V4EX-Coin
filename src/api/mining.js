import _ from '../utilities/index.js'

import Api from "./api.js"

import MiningTask from './mining/mining-task.js'

// import Debug from './debug.js'


export default class Mining extends Api {
  // Predefined stored value keys
  static MINING_TASK = 'mining-task'

  async initialize() {
    await super.initialize()

    this.bindingName = 'MINING'
    this.routePrefix = '/mining'

    this.userRoles = ['miner']

    await this.initializeMiningTask()
  }

  // Initialize the mining task
  async initializeMiningTask() {
    let storedMiningTask = await this.Storage.get(Mining.MINING_TASK)
    this.miningTask = new MiningTask(storedMiningTask ?? { sub: this.sub }, this.Storage)
  }

  // Get according Mining Task
  
  // static async getMiningTask(env, sub) {
  //   let id = env.ERROR.idFromName(sub)
  //   let stub = await env.ERROR.get(id)

  //   let request = new Request('/' + Mining.MINING_TASK, {
  //     method: 'GET',
  //   })

  //   let response = await stub.fetch(request)

  //   return await response.json()
  // }


  async actionRoutes(action, payload, responseMessage) {
    switch (action) {
      case 'HELP': {
        // 501 "Not Implemented"
        responseMessage.setStatus(501)
        
        break
      }
      //
      case 'VIEW': {
        if (this.miningTask.isInitialized()) {
          // 200 "OK"
          responseMessage.setStatus(200, "Returning the initialized Mining Task.")
        } else {
          // 206 "Partial Content"
          responseMessage.setStatus(206, "Mining Task is not yet initialized. Use INITIALIZE.")
        }

        // Add data to payload
        if (responseMessage.status < 400) {
          responseMessage.payload.miningTask = this.miningTask.clone()
          // DEBUG
          // await this.debug(this.miningTask.clone())
        }

        break
      }
      case 'INITIALIZE': {
        // Before interexchanging messages, this.miningTask value has been initialized from DO storage or by code
        // Miner can only initialize a mining task if there is none exists
        if (this.miningTask.isInitialized()) {
          // 409 "Conflict"
          responseMessage.setStatus(409, "Mining Task has been initialized before.")
        } else { // Mining Task not yet initialized
          let initialized = await this.miningTask.initialize()
          if (initialized) {
            // 201 "Created"
            responseMessage.setStatus(201, "New Mining Task has been successfully initialized.")
          }
        }

        // DEBUG
        // console.log(`this.miningTask ${typeof this.miningTask} is: `, this.miningTask)

        // Add data to payload
        if (responseMessage.status < 400) {
          responseMessage.payload.miningTask = this.miningTask.clone()
        }

        break
      }
      case 'SUBMIT': {
        if (!this.miningTask.isInitialized()) { // Not yet initialized
          // 409 "Conflict"
          responseMessage.setStatus(409, "Mining Task is not yet initialized, run INITIALIZE first.")
        } else if (this.miningTask.isSubmitted()) { // Already submitted
          // 409 "Conflict"
          responseMessage.setStatus(409, "Work information exists, RESUBMIT can override.")
        } else { // Initialized, but not yet submitted
          let submitted = await this.miningTask.submit(payload.work)                
          if (submitted) {
            // 201 "Created"
            responseMessage.setStatus(201, "New work information has been successfully submitted.")
          } else {
            // 406 "Not Acceptable"
            responseMessage.setStatus(406, "Submitted work details has failed in verification.")
          }
        }

        // Attach payload
        if (responseMessage.status < 400) {
          responseMessage.payload.miningTask = this.miningTask.clone()
        }

        break
      }
      case 'RESUBMIT': {
        // Only allow resubmit if not proceeded
        if (this.miningTask.isSubmitted()) { // Submitted
          if (this.miningTask.isProceeded()) { // Submitted and proceeded
            // 409 "Conflict";
            responseMessage.setStatus(409, "RESUBMIT is disallowed. Mining task has been already proceeded.")
          } else { // Submitted, but not yet proceeded
            // TODO Check if the same content
            let submitted = await this.miningTask.submit(payload.work)                
            if (submitted) {
              // 200 'OK'
              responseMessage.setStatus(200, "Resubmitted work information has overridden previous one.")
            } else {
              // 406 "Not Acceptable"
              responseMessage.setStatus(406, "Resubmitted work details has failed in verification.")
            }
          }
        } else { // Not yet submitted
          // 409 "Conflict"
          responseMessage.setStatus(409, "RESUBMIT is disallowed. Work information is not yet existed, SUBMIT can create it.")
        }

        // Attach payload
        if (responseMessage.status < 400) {
          responseMessage.payload.miningTask = this.miningTask.clone()
        }

        break
      }
      case 'RESET': {
        await this.miningTask.reset()
        await this.initializeMiningTask()
        // 205 "Reset Content"
        responseMessage.setStatus(205, "Mining task has been successfully resetted.")

        break
      }
      default: {
        // Logging
        console.warn(this.sub, " is trying unknown " + action)
        // 501 "Not Implemented"
        responseMessage.setStatus(501, `Unknown action: ${action}`)
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

    // Debug.wsBroadcast(this.Env, request)

    switch (url.pathname) {
      case this.routePrefix: {
        if (request.headers.get('Upgrade') === 'websocket') {
          const [client, server] = Object.values(new WebSocketPair())

          await this.handleSession(server)
  
          return new Response(null, { status: 101, webSocket: client })
        } else {

          return new Response("WebSocket expected", { status: 400 })
        }

        break
      }

      case this.routePrefix + '/sessions': {
        return new Response(JSON.stringify(this.sessions), { status: 200 })

        break
      }

      case '/' + Mining.MINING_TASK: {
        // Authentication
        let token = _.getAuthorizationBearerFromRequest(request)
        if (token) {
          await this.auth(token)
        }

        if (this.pass) {
          await this.initializeMiningTask()

          // await Debug.wsBroadcast(this.Env, this.miningTask)

          return new Response(JSON.stringify(this.miningTask.clone()), { status: 200 })
        }


        break
      }

      default:
        return new Response('Not found', { status: 404 })
    }
  }

}
