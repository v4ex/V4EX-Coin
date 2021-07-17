import { ModelsList } from "../../../models/base.js"
import { Ownable } from "../../../models/ownable.js"


export class Resource extends Ownable {

  // PROVIDE this.ownerId
  get ownerId() {
    return this.sub
  }

}

export class ResourcesList extends ModelsList {

  // PROVIDE this.model
  // OVERRIDDEN
  get model() {
    return Resource
  }

}
