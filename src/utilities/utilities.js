// Utilities

export default class Utilities {
  // Generate unique ID
  static async randomId() {
    const { Data: id } = await (await fetch('https://csprng.xyz/v1/api')).json()
    return id
  }
}
