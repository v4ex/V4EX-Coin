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

  // PROVIDE this.isValid
  // OVERRIDE
  get isValid() {
    return Object.getOwnPropertyNames(this).length > 0
  }

  toString() {
    JSON.stringify(this)
  }
}

export class ModelsList {

  #models

  // PROVIDE this.#models
  constructor(items = []) {
    this.#models = items.map(item => new this.model(item))
  }

  add(item) {
    this.#models.push(new this.model(item))
  }

  // TODO It is possible to do model check.
  addModel(model) {
    this.#models.push(model)
  }

  // PROVIDE this.isValid
  get isValid() {
    if (!this.models) {
      return false
    }

    for (const model of this.models) {
      if (!model) {
        return false
      }
      if (!model.isValid) {
        return false
      }
    }
    
    return true
  }

  // OVERRIDE
  // PROVIDE this.model
  get model() {
    return Model
  }

  // PROVIDE tis.allModels
  // TODO Protect local data.
  get allModels() {
    return this.#models
  }

  // PROVIDE this.allItems
  get allItems() {
    return JSON.parse(JSON.stringify(this.#models))
  }

}
