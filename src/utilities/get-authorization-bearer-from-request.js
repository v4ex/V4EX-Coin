
export default function getAuthorizationBearerFromRequest(request) {
  let accessToken
  if (request instanceof Request) {
    if (request.headers.get('authorization')) {
      accessToken = request.headers.get('authorization').split(' ')[1]
    }
  }

  return accessToken
}
