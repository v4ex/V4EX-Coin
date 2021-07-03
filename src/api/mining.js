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

    // Try to initialize the mining task
    let storedMiningTask = await this.Storage.get(Mining.MINING_TASK)
    this.miningTask = new MiningTask(storedMiningTask ?? { sub: this.sub }, this.Storage)
  }

  async actionRoutes(action, payload) {
    switch (action) {
      case 'HELP': {
        // 501 "Not Implemented"
        this.Response.setStatus(501)
        break
      }
      case 'INITIALIZE': {
        // Before interexchanging messages, this.miningTask value has been initialized from DO storage or by code
        // Miner can only initialize a mining task if there is none in proceeding
        if (!this.miningTask.isInitialized()) {
          await this.miningTask.initialize()

          // 201 "Created"
          this.Response.setStatus(201, "New mining task has been successfully initialized.")
        }
        else {
          // Mining task has been initialized
          // 304 "Not Modified"
          this.Response.setStatus(304, "Mining task has been initialized before.")
        }
        // DEBUG
        // console.log(`this.miningTask ${typeof this.miningTask} is: `, this.miningTask)

        // Add data to payload
        this.Response.payload.miningTask = this.miningTask.clone()

        break
      }
      //
      case 'VIEW': {
        let storedMiningTask = await this.Storage.get(Mining.MINING_TASK)
        if (storedMiningTask) {
          // 200 "OK"
          this.Response.setStatus(200)
          this.Response.payload.miningTask = storedMiningTask
        } else {
          // 404 "Not Found"
          this.Response.setStatus(404, "Mining task is not yet existed, INITIALIZE can create it.")
        }

        break
      }
      case 'SUBMIT': {
        if (!this.miningTask.isInitialized()) {
          // 404 "Not Found"
          this.Response.setStatus(404, "Mining task is not yet existed, INITIALIZE can create it.")
        } else if (!this.miningTask.isSubmitted()) {
          let submitted = await this.miningTask.submit(payload.work)                
          if (submitted) {
            // 201 "Created"
            this.Response.setStatus(201)
          } else {
            // 406 "Not Acceptable"
            this.Response.setStatus(406, "Submitted work details has failed in verification.")
          }
        } else { // Already submitted
          // 409 "Conflict"
          this.Response.setStatus(409, "Work information exists, RESUBMIT can override.")
        }

        // Attach payload
        if (this.Response.status < 400) {
          this.Response.payload.miningTask = this.miningTask.clone()
        }

        break
      }
      case 'RESUBMIT': {
        // Only allow resubmit if not proceeded
        if (!this.miningTask.isProceeded() && this.miningTask.isSubmitted()) {
          // TODO Check if the same content
          let submitted = await this.miningTask.submit(payload.work)                
          if (submitted) {
            // 200 'OK'
            this.Response.setStatus(200)
          } else {
            // 406 "Not Acceptable"
            this.Response.setStatus(406, "Submitted work details has failed in verification.")
          }
        } else { // Not yet submitted
          // 409 "Conflict"
          this.Response.setStatus(409, "Work information is not yet existed, SUBMIT can create it.")
        }

        // Attach payload
        if (this.Response.status < 400) {
          this.Response.payload.miningTask = this.miningTask.clone()
        }

        break
      }
      // DEBUG
      // SHOULD only allow in Admin ?
      case 'DESTROY': {
        // Nothing to destroy
        if (this.miningTask.isInitialized()) {
          await this.miningTask.destroy()
          this.miningTask = new MiningTask({ sub: this.sub }, this.Storage)
  
          // 204 "No Content"
          this.Response.setStatus(204, "Mining task has been destroyed.")
        } else {
          // 409 "Conflict"
          this.Response.setStatus(409, "Mining task is not yet existed, INITIALIZE can create it.")
        }

        break
      }
      default: {
        // Logging
        console.log(this.sub, " is trying unknown " + action.toString())
        // 501 "Not Implemented"
        this.Response.setStatus(501)
      }
    }
  }

}
