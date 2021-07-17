import { Model, ModelsList } from "./base.js";

/**
 * @property id
 */
export class User extends Model {

  // OVERRIDDEN
  get isValid() {
    return this.id !== undefined
  }

  // OVERRIDDEN
  get defaults() {
    return {
      id: undefined
    }
  }

}

export class UsersList extends ModelsList {

  // OVERRIDDEN
  get model() {
    return User;
  }

}
