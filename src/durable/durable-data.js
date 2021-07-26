// ============================================================================
// 

export default class DurableData {

  // PROVIDE this.bind
  // PROVIDE this.id
  // PROVIDE this.name
  // PROVIDE this.stub
  constructor(bind, name) {
    this.bind = bind
    this.name = name
    this.id = bind.idFromName(name)
    this.stub = bind.get(this.id)
  }

  // CHANGE this.stub
  // PROVIDE this.newStub
  get newStub() {
    this.stub = this.bind.get(this.id)
    return this.stub
  }

  async get(key) {
    const response = await this.stub.fetch(`/${key}`, {
      method: 'GET'
    })

    return await response.json()
  }

  async put(key, value) {
    const response = await this.stub.fetch(`/${key}`, {
      method: 'PUT',
      body: JSON.stringify(value)
    })

    return response.ok
  }

  async delete(key) {
    const response = await this.stub.fetch(`/${key}`, {
      method: 'DELETE'
    })

    return response.ok
  }

  async list() {
    const response = await this.stub.fetch('/', {
      method: 'GET'
    })

    return await response.json()
  }

  async deleteAll() {
    const response = await this.stub.fetch('/', {
      method: 'DELETE'
    })

    return response.ok
  }

}
