import AuthService from './utils/auth.js'

//
import Mining from './api/mining.js'
import Minting from './api/minting.js'
import Serving from './api/serving.js'

//
import miningTaskSchema from '../schema/mining-task.json'
import miningTaskWorkSchema from '../schema/mining-task-work.json'

const Schemas = {
  "mining-task": miningTaskSchema,
  "mining-task-work": miningTaskWorkSchema
}

// Export Durable Object classes
export {
  Mining,
  Minting,
  Serving
}

// Default Handler class of "modules" format
export default {  
  async fetch(request, env) {

    // DEBUG
    // console.log('Hello from Cloudflare Workers')

    const Url = new URL(request.url)

    // Initialize Auth
    const Auth = new AuthService(env)

    // ========================================================================
    // Handle root request
    if (Url.pathname == '/') {
      // Two cases
      // 1. accessToken sent from headers
      // authorization : bearer ${accessToken}
      let accessToken
      if (request.headers.get('authorization')) {
        accessToken = request.headers.get('authorization').split(' ')[1]
      }
      if (accessToken) {
        await Auth.auth(accessToken)
        if (Auth.isAuthenticated()) {
          // DEBUG
          // console.log(Auth.userInfo())
          return new Response(JSON.stringify(Auth.userInfo()), { status: 200 });
        }
      }
      // 2. accessToken not provided
      return new Response("V4EX Coin", { status: 200 });
    }

    // ========================================================================
    // Handle Schema request
    if (Url.pathname.startsWith('/schema/')) {
      const schema = Url.pathname.split('/')[2]
      if (schema) {
        return new Response(JSON.stringify(Schemas[schema]), { status: 200 })
      }
    }

    // ========================================================================
    // Durable Object Websocket

    // ?sub=${sub}
    let sub = Url.searchParams.get('sub') ?? 'V4EX'

    let id, stub

    // wss://${hostname}/mining?sub=${sub}
    if (Url.pathname.startsWith('/mining')) {
      id = env.MINING.idFromName(sub)
      stub = await env.MINING.get(id)
    }

    // wss://${hostname}/serving?sub=${sub}
    if (Url.pathname.startsWith('/serving')) {
      id = env.MINING.idFromName(sub)
      stub = await env.MINING.get(id)
    }

    // wss://${hostname}/minting?sub=${sub}
    if (Url.pathname.startsWith('/minting')) {
      id = env.MINING.idFromName(sub)
      stub = await env.MINING.get(id)
    }

    let response = await stub.fetch(request)

    return response
  }
}
