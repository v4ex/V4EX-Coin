import { ModelsList } from "../../../../models/base.js"
import { Ownable } from "../../../../models/ownable.js"


export class MiningTask extends Ownable {

  // PROVIDE this.ownerId
  get ownerId() {
    return this.sub
  }

}

export class MiningTasksList extends ModelsList {

  // PROVIDE this.model
  get model() {
    return MiningTask
  }

}
