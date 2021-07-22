import _ from 'lodash'

import { default as BaseAction } from '../../../web-socket/action.js'
import MiningTaskResource from '../mining-task-resource.js'

// ============================================================================
// Permissions
//
// Situation: Authenticated User is trying to operate on his own Resource.


// ============================================================================
// 

export default class Action extends BaseAction {

  // OVERRIDDEN
  // PROVIDE this.isAllowed
  async isAllowed() {
    // Validate resource
    if (!this.isValidResource) {
      return false
    }

    return this.isAuthenticatedUser
  }

  // ==========================================================================
  // Templates for do()

  // CHANGE this.resource
  // CHANGE this.responseMessage
  // REQUIRE this.resource[`isIn${Role}Stage`]
  // REQUIRE this.resource[`can${Operate}`]
  // REQUIRE this.resource[operate]
  async doOperate(role, operate, operated, args = []) {
    const miningTaskResource = this.resource
    const RESOURCE = miningTaskResource.key
    const responseMessage = this.responseMessage

    const Role = _.upperFirst(role)
    const Operate = _.upperFirst(operate)

    if(!miningTaskResource[`isIn${Role}Stage`]) {
      responseMessage.setStatus(403, `The ${RESOURCE} is not in ${Role} stage.`) // "Forbidden"
    } else {
      if (!miningTaskResource[`can${Operate}`]) {
        responseMessage.setStatus(400, `${Operate} can not be applied to the current ${RESOURCE}.`) // "Bad Request"
      } else {
        await miningTaskResource[operate](...args)
          .then(isProcessed => {
            if (isProcessed) {
              responseMessage.setStatus(200, `The ${RESOURCE} is successfully ${operated}.`) // "OK"
            } else {
              responseMessage.setStatus(400, `The ${RESOURCE} is failed to be ${operated}.`) // "Bad Request"
            }
          })
          .catch(error => {
            responseMessage.setStatus(500, error.message) // Internal Server Error
          })
      }
    }
  }

  // CHANGE this.resource
  // CHANGE this.responseMessage
  // REQUIRE this.resource[`isIn${Role}Stage`]
  // REQUIRE this.resource[`is${Operated}`]
  // REQUIRE this.resource[`can${Operate}`]
  // REQUIRE this.resource[`revert${Operate}`]
  async doRevertOperate(role, operate, operated, args = []) {
    const miningTaskResource = this.resource
    const RESOURCE = miningTaskResource.key
    const responseMessage = this.responseMessage

    const Role = _.upperFirst(role)
    const Operate = _.upperFirst(operate)
    const Operated = _.upperFirst(operated)

    if(!miningTaskResource[`isIn${Role}Stage`]) {
      responseMessage.setStatus(403, `The ${RESOURCE} is not in ${Role} stage.`) // "Forbidden"
    } else {
      if (!miningTaskResource[`is${Operated}`]) {
        responseMessage.setStatus(409, `The ${RESOURCE} has not been ${operated} yet.`) // "Conflict"
      } else {
        if (!miningTaskResource[`canRevert${Operate}`]) {
          responseMessage.setStatus(400, `Revert ${Operate} can not be applied to the current ${RESOURCE}.`) // "Bad Request"
        } else {
          await miningTaskResource[`revert${Operate}`](...args)
            .then(isReverted => {
              if (isReverted) {
                responseMessage.setStatus(200, `Revert ${Operate} to the ${RESOURCE} is succeeded.`) // "OK"
              } else {
                responseMessage.setStatus(400, `Revert ${Operate} to the ${RESOURCE} is failed.`) // "Bad Request"
              }
            })
            .catch(error => {
              responseMessage.setStatus(500, error.message) // Internal Server Error
            })
        }
      }
    }
  }

  // CHANGE this.resource
  // CHANGE this.responseMessage
  // REQUIRE this.resource[`isIn${Role}Stage`]
  // REQUIRE this.resource[`is${Operated}`]
  // REQUIRE this.resource[`can${Operate}`]
  // REQUIRE this.resource[`clear${Operate}`]
  async doClearOperate(role, operate, operated, args = []) {
    const miningTaskResource = this.resource
    const RESOURCE = miningTaskResource.key
    const responseMessage = this.responseMessage
    const Operated = _.upperFirst(operated)

    const Role = _.upperFirst(role)
    const Operate = _.upperFirst(operate)

    if(!miningTaskResource[`isIn${Role}Stage`]) {
      responseMessage.setStatus(403, `The ${RESOURCE} is not in ${Role} stage.`) // "Forbidden"
    } else {
      if (!miningTaskResource[`is${Operated}`]) {
        responseMessage.setStatus(409, `The ${RESOURCE} has not been ${operated} yet.`) // "Conflict"
      } else {
        if (!miningTaskResource[`canClear${Operate}`]) {
          responseMessage.setStatus(400, `Clear ${Operate} can not be applied to the current ${RESOURCE}.`) // "Bad Request"
        } else {
          await miningTaskResource[`clear${Operate}`](...args)
            .then(isCleared => {
              if (isCleared) {
                responseMessage.setStatus(200, `Clear ${Operate} to the ${RESOURCE} is succeeded.`) // "OK"
              } else {
                responseMessage.setStatus(400, `Clear ${Operate} to the ${RESOURCE} is failed.`) // "Bad Request"
              }
            })
            .catch(error => {
              responseMessage.setStatus(500, error.message) // Internal Server Error
            })
        }
      }
    }
  }

  // CHANGE this.resource
  // CHANGE this.responseMessage
  // REQUIRE this.resource[`isIn${Role}Stage`]
  // REQUIRE this.resource[`can${Operate}`]
  // REQUIRE this.resource[operate]
  // OVERRIDDEN
  async doReleaseOperate(role, previousRole, operate, operated) {
    const miningTaskResource = this.resource
    const RESOURCE = miningTaskResource.key
    const responseMessage = this.responseMessage

    const Role = _.upperFirst(role)
    const PreviousRole = _.upperFirst(previousRole)
    const Operate = _.upperFirst(operate)

    if(!miningTaskResource[`isIn${Role}Stage`]) {
      responseMessage.setStatus(403, `The ${RESOURCE} is not in ${Role} stage.`) // "Forbidden"
    } else {
      if (!miningTaskResource[`can${Operate}`]) {
        responseMessage.setStatus(400, `${Operate} can not be applied to the current ${RESOURCE}.`) // "Bad Request"
      } else {
        await miningTaskResource[operate]()
          .then(isProcessed => {
            if (isProcessed) {
              responseMessage.setStatus(200, `The ${RESOURCE} is successfully ${operated} from ${Role} to ${PreviousRole}.`) // "OK"
            } else {
              responseMessage.setStatus(400, `The ${RESOURCE} is failed to be ${operated} from ${Role} to ${PreviousRole}.`) // "Bad Request"
            }
          })
          .catch(error => {
            responseMessage.setStatus(500, error.message) // Internal Server Error
          })
      }
    }
  }

  // ==========================================================================
  // Helpers

  // OVERRIDDEN
  // PROVIDE this.isValidResource
  get isValidResource() {
    if (!(this.resource instanceof MiningTaskResource)) {
      return false
    }
    return true
  }

  // ENV MINING_BROKERS
  /**
   * Test if the Brokering Mining Task match the current acting Broker.
   */
  async isMatchedBrokeringMiningTask() {
    // Acting user must be a broker.
    if (! await this.isBrokerUser()) {
      return false
    }

    // Mining Task work must be submitted.
    const miningTaskResource = this.resource
    if (!miningTaskResource.isSubmitted) {
      return false
    }
    
    // Check work information
    const miningTask = this.resourceModel
    if (this.user.id !== JSON.parse(process.env.MINING_BROKERS)[miningTask.work.server]) {
      return false
    }

    return true
  }

}
