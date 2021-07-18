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
  constructor(stored = {}, storage, key) {
    // All passed in parameters SHOULD be registered as private properties of
    //   the object.
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
