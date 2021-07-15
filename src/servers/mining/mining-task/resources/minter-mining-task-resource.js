import Resource from '../../../web-socket/resource.js'

// Mining Task in the view of Minter

// TODO Report error
export default class MinterMiningTaskResource extends Resource {

  view() {
    return this.source.model
  }

}
