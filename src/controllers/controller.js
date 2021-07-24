export default class Controller {
  constructor(request, env) {
    this.request = request
    this.env = env
  }

  get url() {
    return new URL(this.request.url)
  }

  // OVERRIDE
  // PROVIDE 
  get canHandle() {
    return false
  }

  // OVERRIDE
  async handleRequest() {
    return new Response("OK", { status: 200 })
  }
}
