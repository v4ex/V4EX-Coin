import Api from "./api.js"

import MiningTask from './mining/mining-task.js'


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

}
