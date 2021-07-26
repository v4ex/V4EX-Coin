// ============================================================================
// Durable Object
// Data Source
// Create a class to extend this and bind to new name to create a data source.

export default class DurableObject {

  // PROVIDE this.env
  // PROVIDE this.id
  // PROVIDE this.state
  // PROVIDE this.storage
  constructor(state, env){
    this.env = env
    this.state = state
    this.id = state.id
    this.storage = state.storage
  }

  // PROVIDE this.request
  async fetch(request) {
    this.request = request

    if (this.key) {
      switch (this.method) {
        case 'GET': {
          const responseValue = await this.storage.get(this.key)
          return new Response(responseValue, { status: 200 })

          break
        }
        case 'PUT': {
          await this.storage.put(this.key, await this.request.text())
          return new Response("OK", { status: 200 })

          break
        }
        case 'DELETE': {
          await this.storage.delete(this.key)
          return new Response("OK", { status: 200 })

          break
        }
      }
    } else {
      switch (this.method) {
        case 'GET': {
          const responseValue = await this.storage.list()
          return new Response(JSON.stringify(Object.fromEntries(responseValue)), { status: 200 })

          break
        }
        case 'DELETE': {
          await this.storage.deleteAll()
          return new Response("OK", { status: 200 })

          break
        }
      }
    }

    return new Response("Bad Request", { status: 400 })
  }

  // ==========================================================================
  // After this.request = request in fetch().

  // PROVIDE this.method
  get method() {
    return this.request.method
  }

  // PROVIDE this.url
  get url() {
    return new URL(this.request.url)
  }

  // PROVIDE this.key
  get key() {
    const parts = this.url.pathname.split('/')

    return parts[1]
  }

}
