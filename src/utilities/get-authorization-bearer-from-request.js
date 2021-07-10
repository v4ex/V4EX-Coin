
export default function getAuthorizationBearerFromRequest(request) {
  let token
  if (request instanceof Request) {
    if (request.headers.get('authorization')) {
      token = request.headers.get('authorization').split(' ')[1]
    }
  }

  return token
}
