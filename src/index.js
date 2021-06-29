import AuthService from './auth.js'
import Miner from './miner.js'

export {
  Miner
}

export default {  
  async fetch(request, env) {

    // DEBUG
    // console.log('Hello from Cloudflare Workers')

    const Url = new URL(request.url)
    
    // ?sub=${sub}
    let sub = Url.searchParams.get('sub') ?? 'V4EX'

    // Initialize Auth
    const Auth = new AuthService(sub)

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
        if (Auth.isAuthenticated) {
          return new Response(JSON.stringify(Auth.userInfo), { status: 200 });
        }
      }
      // 2. accessToken not provided
      return new Response(sub, { status: 200 });
    }

    // Durable Object Websocket
    let id = env.MINER.idFromName(sub)

    // DEBUG
    // console.log(id)

    let stub = await env.MINER.get(id)

    let response = await stub.fetch(request)

    return response
  }
}
