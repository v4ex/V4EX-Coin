// Cloudflare Workers Durable Object
// Runtime API https://developers.cloudflare.com/workers/runtime-apis/durable-objects
export default class Miner {
  constructor(state, env){
    this.state = state
    this.env = env
    this.sessions = []
    this.request = {}
    this.isAuthenticated = false
    this.auth0UserInfo = "https://v4ex.us.auth0.com/userinfo"
    this.userAccessToken = ""
    this.userInfo = {}
  }

  async initialize() {
    //
    let stored = await this.state.storage.get("value");
    this.value = stored || "";
  }

  // Get userinfo from authenticated Auth0 user
  async auth(accessToken) {
    if (!this.isAuthenticated) {
      this.userAccessToken = accessToken
    
      let auth0Response = await fetch(this.auth0UserInfo, {
        method: 'GET',
        headers: {
          authorization: "bearer " + accessToken
        }
      })

      if (auth0Response.status == 200) {
        this.isAuthenticated = true
        this.userInfo = await auth0Response.json()
        // Check Durable Object id
        if (this.state.id.toString() != this.env.MINER.idFromName(this.userInfo.sub).toString()) {
          this.isAuthenticated = false
        }
      }
    } else {
      // Changed accessToken
      if (accessToken != this.userAccessToken) {
        this.isAuthenticated = false
        await this.auth(accessToken)
      }
    }
  }

  clearSession(session, webSocket) {
    this.sessions = this.sessions.filter((_session) => _session !== session)
    webSocket.close(1011, 'WebSocket closed.')
  }

  broadcast(message) {
    this.sessions.forEach((session) => {
      session.webSocket.send(JSON.stringify(message))
    })
  }

  async handleSession(webSocket) {
    webSocket.accept()

    let session = { webSocket }
    this.sessions.push(session)

    webSocket.addEventListener("message", async ({ data }) => {
      try {
        const { accessToken } = JSON.parse(data)
        // let accessToken = JSON.parse(data).accessToken

        await this.auth(accessToken)

        if (!this.isAuthenticated) {
          webSocket.send("Unauthorized")
          webSocket.send(this.state.id.toString())
          if ('sub' in this.userInfo) {
            webSocket.send(this.env.MINER.idFromName(this.userInfo.sub).toString())
          }

          return
        }

        let response = {
          server: "Cloudflare Workers",
          data: data
        }
  
        webSocket.send("Cloudflare Workers")
        webSocket.send(JSON.stringify(this.userInfo))

      } catch (err) {
        webSocket.send("Unauthorized")
        return
      }


    })

    webSocket.addEventListener('close', () => {
      this.clearSession(session, webSocket)
    })

    webSocket.addEventListener('error', () => {
      this.clearSession(session, webSocket)
    })
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

    switch (url.pathname) {
      case '/ws': {
        if (request.headers.get('Upgrade') === 'websocket') {
          const [client, server] = Object.values(new WebSocketPair())

          await this.handleSession(server)
  
          return new Response(null, { status: 101, webSocket: client })
        } else {

          return new Response('WebSocket expected', { status: 400 })
        }
      }

      case '/ws/sessions': {
        return new Response(JSON.stringify(this.sessions), { status: 200 })
      }

      case '/ws/request': {
        return new Response(JSON.stringify(request), { status: 200 })
      }

      default:
        return new Response('Not found', { status: 404 })
    }
  }
}