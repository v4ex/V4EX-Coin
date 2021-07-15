import _ from 'lodash'
import randomString from "./random-string.js"
import getAuthorizationBearerFromRequest from './get-authorization-bearer-from-request.js'

_.mixin({
  randomString,
  getAuthorizationBearerFromRequest,
})

/**
 * @function randomString()
 * @function getAuthorizationBearerFromRequest(request: Request)
 */
export default _
