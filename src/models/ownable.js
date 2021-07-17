import { Model } from "./base.js";

export class Ownable extends Model {

  // PROVIDE this.ownerId
  // Force class extends
  get ownerId() {
    return undefined
  }

  // OVERRIDDEN
  get isValid() {
    return this.ownerId !== undefined
  }

}
