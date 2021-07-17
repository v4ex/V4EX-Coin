// Utilize Durable Object Storage

import { map } from "lodash"
import { Model } from "../../models/base.js"

import Action from "./action.js"

// ============================================================================
// ResourceActionsList

// PROTOCOL
export const ResourceActionsList = new map(Object.entries({
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

  // PROVIDE this.attributes
  // OVERRIDE
  get attributes() {
    return {}
  }

  // OVERRIDE
  toModel() {
    return new Model(this.attributes)
  }

}
