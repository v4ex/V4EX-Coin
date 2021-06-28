import Auth from './auth.mjs'
import Miner from './miner.mjs'

export {
  Miner
}

export default {  
  async fetch(request, env) {

    // DEBUG
    // console.log('Hello from Cloudflare Workers')
    
    //
    let sub = new URL(request.url).searchParams.get('sub') ?? 'V4EX'

    // Initialize Auth
    const auth = new Auth(sub)

    // Handle root request
    let url = new URL(request.url)
    if (url.pathname == '/') {
      // Two cases
      // 1. accessToken sent from headers
      // authorization : bearer ${accessToken}
      let accessToken
      if (request.headers.get('authorization')) {
        accessToken = request.headers.get('authorization').split(' ')[1]
      }
      if (accessToken) {
        await auth.auth(accessToken)
        if (auth.isAuthenticated) {
          return new Response(JSON.stringify(auth.userInfo), { status: 200 });
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
