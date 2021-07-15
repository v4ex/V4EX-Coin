import _ from '../utilities/index.js'

export class Model {
  constructor(attributes = {}) {
    _.defaultsDeep(this, attributes, this.defaults)
  }

  // OVERRIDE
  // PROVIDE this.defaults
  get defaults() {
    return {}
  }
}

export class ModelsList {
  constructor(items = []) {
    this.models = items.map(item => new this.model(item))
  }

  add(item) {
    this.models.push(new this.model(item))
  }

  // OVERRIDE
  // PROVIDE this.model
  get model() {
    return Model
  }
}
