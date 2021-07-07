import _ from 'lodash'
import randomString from "./random-string.js"
import getAuthorizationBearerFromRequest from './get-authorization-bearer-from-request.js'

_.mixin({
  randomString,
  getAuthorizationBearerFromRequest,
})

export default _
