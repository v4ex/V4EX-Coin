import Resource from '../../../web-socket/resource.js'

// Mining Task in the view of Miner

// TODO Report error
export default class MinerMiningTaskResource extends Resource {

  view() {
    return this.source.model
  }

  async initialize() {
    return await this.source.initialize()
  }

  async submit(work) {
    return await this.source.submit(work)
  }

  async resubmit(work) {
    return await this.source.resubmit(work)
  }

  async reset() {
    return await this.source.reset()
  }

}
