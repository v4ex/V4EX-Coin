import { Model, ModelsList } from "./base.js";

/**
 * @property id
 */
export class User extends Model {
  get isUser() {
    return this.id !== undefined
  }
}

export class UsersList extends ModelsList {
  get model() {
    return User;
  }

  get getAll() {
    return this.models
  }
}
