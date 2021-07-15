import Resource from '../../../web-socket/resource.js'


// Mining Task in the view of Broker

// TODO Report error
export default class BrokerMiningTaskResource extends Resource {

  view() {
    return this.source.model
  }

  async reject() {
    return await this.source.reject()
  }

  // TODO Allow setting timestamp committed here
  async proceed() {
    return await this.source.proceed()
  }

  async confirm() {
    return await this.source.confirm()
  }

}
