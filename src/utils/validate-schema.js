import * as schemasValidate from './schemas.cjs'

export default function validateSchema($id, data) {
  // Allow input short schema id instead of full URI $id.
  let base
  if (!$id.startsWith('http')) {
    base = 'https://schema.v4ex.com'
  }
  let uri = new URL($id, base)

  let valid = schemasValidate[uri.href](data)

  return valid
}
