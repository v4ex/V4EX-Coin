import { Resource, ResourcesList } from '../../../web-socket/models/resource.js'


export class MiningTask extends Resource {

  // PROVIDE this.ownerId
  get ownerId() {
    return this.sub
  }

}

export class MiningTasksList extends ResourcesList {

  // PROVIDE this.model
  get model() {
    return MiningTask
  }

}
