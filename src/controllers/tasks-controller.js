import AuthController from './auth-controller.js'


export default class TasksController extends AuthController {

  // OVERRIDDEN
  // PROVIDE 
  get canHandle() {
    const url = this.url
    if (url.pathname.startsWith('/tasks')) {
      return true
    }
    return false
  }

  // OVERRIDDEN
  async handleRequest() {
    await this.authenticate()
    
    if (!this.authentication.isAuthenticated) {
      return new Response("Unauthorized", { status: 401 })
    } else {
      this.authorize()
    }

    switch (this.$role) {
      case 'broker': {
        if (await this.authorization.isBroker()) {
          return this.handleRequestBroker()
        } else {
          return new Response("Forbidden", { status: 403 })
        }

        break
      }
      case 'minter': {
        if (await this.authorization.isMinter()) {
          return this.handleRequestMinter()
        } else {
          return new Response("Forbidden", { status: 403 })
        }

        break
      }
      default:
        return new Response("Bad Request", { status: 400 })
    }
  }

  // ENV BROKER_MINING_TASKS
  // TODO Pagination
  async handleRequestBroker() {
    const list = await this.env.BROKER_MINING_TASKS.list({
      prefix: await this.authorization.getBrokerName()
    })

    return new Response(JSON.stringify(list), { status: 200 })
  }

  // ENV MINTER_MINING_TASKS
  // TODO Pagination
  async handleRequestMinter() {
    const list = await this.env.MINTER_MINING_TASKS.list({
      prefix: await this.authorization.getMinterName()
    })

    return new Response(JSON.stringify(list), { status: 200 })
  }

}
