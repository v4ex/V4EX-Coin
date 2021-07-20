// Utilize Durable Object Storage

import { Resource as ResourceModel } from './models/resource.js'

import Action from "./action.js"

// ============================================================================
// ResourceActionsList

// PROTOCOL
export const ResourceActionsList = new Map(Object.entries({
  'DEFAULT': Action
}))


// ============================================================================
// Resource

export default class Resource {
  
  // OVERRIDE
  constructor(init = {}, storage, key) {
    // All passed in parameters SHOULD be registered as private properties of
    //   the object.

    // this#init = init
    // this.#storage = storage
    // this.#key = key
  }

  // OVERRIDE
  async construct() {
  }

  static async create(resourceClass, init, storage, key) {
    const resource = new resourceClass(init, storage, key)
    await resource.construct()

    return resource
  }

  // OVERRIDE
  get actionsList() {
    return ResourceActionsList
  }

  // OVERRIDE
  // PROVIDE this.attributes
  get attributes() {
    return {}
  }

  // OVERRIDE
  toModel() {
    return new ResourceModel(this.attributes)
  }

}
