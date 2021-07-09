import { Model, ModelsList } from "./base.js";


export class User extends Model {
}

export class UsersList extends ModelsList {
  get model() {
    return User;
  }

  get getAll() {
    return this.models
  }
}
