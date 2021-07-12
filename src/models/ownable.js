import { Model } from "./base.js";

export class Ownable extends Model {

  // Force class extends
  get ownerId() {
    return undefined
  }

  get isOwnable() {
    return this.ownerId !== undefined
  }

}
