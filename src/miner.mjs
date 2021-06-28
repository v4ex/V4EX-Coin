import AuthService from './auth.mjs'

// Cloudflare Workers Durable Object
// Runtime API https://developers.cloudflare.com/workers/runtime-apis/durable-objects
export default class Miner {
  constructor(state, env){
    this.state = state // Durable Object state
    this.env = env // Durable Object env
    //
    this.sessions = [] // Web socket sessions
    this.request = {} // Web request
    this.Url = {} // Web request URL
    //
    this.sub = 'V4EX' // User sub
    this.Auth = {} // Auth service
    this.pass = false // message passage status
    //
    this.miningTasks = [] // List of mining tasks
    this.miningTask = {} // The current mining task
  }

  // Before calling this, this.request is ready.
  async initialize() {
    //
    this.Url = new URL(this.request.url)
    this.sub = this.Url.searchParams.get('sub') ?? this.sub
    this.Auth = new AuthService(this.sub)
    //
    let stored = await this.state.storage.get('value');
    this.value = stored || '';
  }

  // Get userinfo from authenticated Auth0 user
  async auth(accessToken) {
    await this.Auth.auth(accessToken)
    // Equal pass value AuthServie authentication status
    this.pass = this.Auth.isAuthenticated
    // Successful authenticated
    if (this.pass) {
      // Check Integrity of Durable Object
      if (this.state.id.toString() != this.env.MINER.idFromName(this.Auth.userInfo.sub).toString()) {
        this.pass = false
      }
    }
  }

  clearSession(session, webSocket) {
    this.sessions = this.sessions.filter((_session) => _session !== session)
    webSocket.close(1011, "WebSocket closed.")
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

    webSocket.addEventListener('message', async ({ data }) => {
      try {
        // Extract data from client message
        const { accessToken, action, playload } = JSON.parse(data)
        // DEBUG
        // console.log("accessToken: ", accessToken)
        // console.log("action: ", action)
        // console.log("playload: ", playload)

        // Authentication
        await this.auth(accessToken)

        // Actions route
        switch (action) {
          case 'INITIALIZE': {
            // Miner can only initialize a mining task if there is none in proceeding

          }
          case 'PROCEED': {
            //

          }
        }

      } catch (error) {
        // Error
        console.log("Error caught processing income message:", error.message);
        console.log(error.stack);

        webSocket.send("Error.")
        return
      }

      // Passed message
      if (!this.pass) {
        webSocket.send('Unauthorized')
        // DEBUG
        // console.log("Durable Object id: ", this.state.id.toString())
        // if ('sub' in this.Auth.userInfo) {
        //   console.log("Durable Object id from user sub: ", this.env.MINER.idFromName(this.Auth.userInfo.sub).toString())
        // }

        return
      }

      let response = {
        server: "Cloudflare Workers",
        data: data
      }

      webSocket.send("Cloudflare Workers")
      // DEBUG
      webSocket.send(JSON.stringify(this.Auth.userInfo))


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
      case '/mining': {
        if (request.headers.get('Upgrade') === 'websocket') {
          const [client, server] = Object.values(new WebSocketPair())

          await this.handleSession(server)
  
          return new Response(null, { status: 101, webSocket: client })
        } else {

          return new Response("WebSocket expected", { status: 400 })
        }
      }

      case '/mining/sessions': {
        return new Response(JSON.stringify(this.sessions), { status: 200 })
      }

      case '/mining/request': {
        return new Response(JSON.stringify(request), { status: 200 })
      }

      default:
        return new Response('Not found', { status: 404 })
    }
  }
}