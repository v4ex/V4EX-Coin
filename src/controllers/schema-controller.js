import Controller from './controller.js'

import miningTaskSchema from '../schemas/mining-task.json'
import miningTaskWorkSchema from '../schemas/mining-task-work.json'

const Schemas = new Map()
Schemas.set('mining-task', miningTaskSchema)
Schemas.set('mining-task-work', miningTaskWorkSchema)

export default class SchemaController extends Controller {
  
  // OVERRIDDEN
  // PROVIDE this.schemaName
  get canHandle() {
    const url = new URL(this.request.url)
    const nameParts = url.pathname.split('/')
    if (nameParts[1] === 'schema') {
      this.schemaName = nameParts[2]
      if (Schemas.has(this.schemaName)) {
        return true
      }
    }

    return false
  }

  // OVERRIDDEN
  async handleRequest() {
    return this.schema(this.schemaName)
  }

  schema(schemaName) {
    if (Schemas.has(schemaName)) {
      return new Response(JSON.stringify(Schemas.get(schemaName)), { status: 200 })
    }
    return new Response("Not Found", { status: 404 })
  }

}
