export default class Controller {
  constructor(request, env) {
    this.request = request
    this.env = env
  }

  get url() {
    return new URL(this.request.url)
  }

  get canHandle() {
    return false
  }

  handleRequest() {
    return new Response("OK", { status: 200 })
  }
}
