import Controller from "./controller.js"


export default class WebSocketController extends Controller {

  prefix
  prefixes = [
    'mining',
    'brokering',
    'minting',
    'error',
    'debug'
  ]

  // PROVIDING this.sub
  // PROVIDING this.prefix
  //
  // If this controller can handle
  get canHandle() {
    // ?sub=${sub}
    this.sub = this.url.searchParams.get('sub') ?? 'V4EX'

    this.prefix = this.url.pathname.split('/')[1]

    if (this.prefixes.includes(this.prefix)) {
      return true
    }
    return false
  }


  handleRequest() {
    return this[this.prefix](this.request, this.env, this.sub)
  }


  // wss://${hostname}/mining?sub=${sub}
  async mining(request, env, sub) {
    const id = env.MINING.idFromName(sub)
    const stub = env.MINING.get(id)

    return stub.fetch(request)
  }

  // wss://${hostname}/brokering?sub=${sub}
  async brokering(request, env, sub) {
    const id = env.BROKERING.idFromName(sub)
    const stub = env.BROKERING.get(id)

    return stub.fetch(request)
  }

  // wss://${hostname}/minting?sub=${sub}
  async minting(request, env, sub) {
    const id = env.MINTING.idFromName(sub)
    const stub = env.MINTING.get(id)

    return stub.fetch(request)
  }

  // wss://${hostname}/error
  async error(request, env) {
    const id = env.ERROR.idFromName('V4EX')
    const stub = env.ERROR.get(id)

    return stub.fetch(request)
  }

  // wss://${hostname}/debug
  async debug(request, env) {
    const id = env.DEBUG.idFromName('V4EX')
    const stub = env.DEBUG.get(id)

    return stub.fetch(request)
  }

}
