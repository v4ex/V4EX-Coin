import _ from '../utilities/index.js'

// can
// cannot
// allow
// disallow

// Roles
// Permissions
//   - Owner only

// Authorize Route
// Authorize Route Message Action

// TODO hasRoles()
// TODO ACL
export default class AuthorizationService {

  constructor() {
  }

  /**
   * 
   * @param {Ownable} ownable 
   * @param {User} user 
   */
  isOwnedBy(ownable, user) {
    return ownable.isOwnable && user.isUser && ownable.ownerId === user.id
  }

}
