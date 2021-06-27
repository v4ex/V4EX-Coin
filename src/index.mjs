import Miner from "./miner.mjs"

export {
  Miner
}

export default {  
  async fetch(request, env) {

    //
    let sub = new URL(request.url).searchParams.get('sub') ?? "A"

    // Durable Object Websocket
    let id = env.MINER.idFromName(sub)

    let stub = await env.MINER.get(id)

    let response = await stub.fetch(request)

    return response
  }
}
