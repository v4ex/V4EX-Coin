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
// Utilize Durable Object Storage
// As Data Object
// Only exists in corresponding Durable Object.

export default class Resource {
  
  // ==========================================================================
  //

  #init
  #storage
  #key

  // ==========================================================================
  //

  // PROVIDE Resource.NAME
  static get NAME() {
    return 'RESOURCE'
  }

  // ==========================================================================
  //
  
  // OVERRIDE
  constructor(init = {}, storage, key) {
    // All passed in parameters SHOULD be registered as private properties of
    //   the object.

    this.#init = init
    this.#storage = storage
    this.#key = key
  }

  // OVERRIDE
  async construct() {
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

  /**
   * Save data in Durable Object storage.
   * Possible Network Loss Error?
   */
  // OVERRIDE
   async save() {
    if (!this.#storage) {
      throw new Error("No storage.")
    }

    await this.#storage.put(this.#key, this.toModel())
  }

  // ==========================================================================
  //

  static async create(resourceClass, init, storage, key) {
    const resource = new resourceClass(init, storage, key)
    await resource.construct()

    return resource
  }

}
