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
      case 'INITIALIZE': {
        // Before interexchanging messages, this.miningTask value has been initialized from DO storage or by code
        // Miner can only initialize a mining task if there is none in proceeding
        if (!this.miningTask.isInitialized()) {
          await this.miningTask.initialize()

          // 201 'Created'
          this.Response.setStatus(201)
        }
        else {
          // Mining task has been initialized
          // 304 "Not Modified"
          this.Response.setStatus(304)
        }
        // DEBUG
        // console.log(`this.miningTask ${typeof this.miningTask} is: `, this.miningTask)

        // Add data to payload
        this.Response.payload.miningTask = this.miningTask

        break
      }
      //
      case 'VIEW': {
        this.Response.payload.miningTask = await this.Storage.get(Mining.MINING_TASK)

        break
      }
      case 'SUBMIT': {
        if (!this.miningTask.isSubmitted()) {
          let submitted = await this.miningTask.submit(payload.work)                
          if (submitted) {
            // 201 'Created'
            this.Response.setStatus(201)
          } else {
            // 400 "Bad request"
            this.Response.setStatus(400)
          }
        } else { // Already submitted
          // 304 "Not Modified"
          this.Response.setStatus(304)
        }

        // Attach payload
        if (this.Response.status < 400) {
          this.Response.payload.miningTask = this.miningTask
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
            // 400 "Bad request"
            this.Response.setStatus(400)
          }
        } else { // Not yet submitted
          // 400 "Bad request"
          this.Response.setStatus(400)
        }

        // Attach payload
        if (this.Response.status < 400) {
          this.Response.payload.miningTask = this.miningTask
        }

        break
      }
      // DEBUG
      // case 'SAVE': {
      //   await this.miningTask.save()
      //   this.Response.payload.miningTask = this.miningTask
      //   // DEBUG
      //   console.log("Mining task in storage: ", await this.Storage.get(Miner.MINING_TASK))

      //   break
      // }
      // DEBUG
      case 'DESTROY': { // SHOULD only allow in Admin
        await this.miningTask.destroy()
        this.miningTask = new MiningTask({ sub: this.sub }, this.Storage)

        // 200 "OK"
        this.Response.setStatus(200)

        break
      }
      default: {
        // DEBUG
        // webSocket.send('Unknown API request.')
        // LOG
        console.log(this.sub, " is trying unknown " + action.toString())

        // 400 "Bad Request"
        this.Response.setStatus(400)
      }
    }
  }

}
