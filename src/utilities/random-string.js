// Generate unique ID
// TODO Allow custom length
export default async function randomString() {
  const { Data: result } = await (await fetch('https://csprng.xyz/v1/api')).json()

  return result
}
