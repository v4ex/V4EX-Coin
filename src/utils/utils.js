// Utilities

export default class Utils {
  // Generate unique ID
  static async uniqueId() {
    const { Data: id } = await (await fetch('https://csprng.xyz/v1/api')).json()
    return id
  }
}
