import { ModelsList } from "../../../models/base.js"
import { Ownable } from "../../../models/ownable.js"


export class Source extends Ownable {

  // PROVIDE this.ownerId
  get ownerId() {
    return this.sub
  }

}

export class SourcesList extends ModelsList {

  // PROVIDE this.model
  // OVERRIDDEN
  get model() {
    return Source
  }

}
