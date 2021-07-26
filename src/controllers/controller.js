export default class Controller {

  // AVAILABLE this.$PARAM
  // PROVIDE this.request
  // PROVIDE this.env
  constructor(request, env) {
    this.request = request
    this.env = env

    for (const [key, value] of this.url.searchParams) {
      this[`$${key}`] = value
    }
  }

  // ==========================================================================
  // 

  // OVERRIDE
  // PROVIDE this.canHandle
  get canHandle() {
    return false
  }

  // OVERRIDE
  async handleRequest() {
    return new Response("OK", { status: 200 })
  }

  // ==========================================================================
  // 

  // PROVIDE this.method
  get method() {
    return this.request.method
  }

  // PROVIDE this.url
  get url() {
    return new URL(this.request.url)
  }

}
