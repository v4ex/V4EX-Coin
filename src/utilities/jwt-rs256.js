// Utility class for handling JSON Web Token

export default class Jwt {
  /**
   * Parse and decode a JWT.
   * A JWT is three, base64 encoded, strings concatenated with '.':
   *   a header, a payload, and the signature.
   * The signature is "URL safe", in that '/+' characters have been replaced by '_-'
   *
   * Steps:
   *   1. Split the token at the '.' character
   *   2. Base64 decode the individual parts
   *   3. Retain the raw Bas64 encoded strings to verify the signature
   */
  static decodeJwt(token) {
    const parts = token.split(".")
    const header = JSON.parse(atob(parts[0]))
    const payload = JSON.parse(atob(parts[1]))
    const signature = atob(parts[2].replace(/_/g, "/").replace(/-/g, "+"))

    return {
      header: header,
      payload: payload,
      signature: signature,
      raw: {
        header: parts[0],
        payload: parts[1],
        signature: parts[2]
      },
    }
  }

  /**
   * Validate the JWT.
   *
   * Steps:
   *   1. Reconstruct the signed message from the Base64 encoded strings.
   *   2. Load the RSA public key into the crypto library.
   *   3. Verify the signature with the message and the key.
   * 
   * Auth0 jwk URL: https://[your_domain].auth0.com/.well-known/jwks.json
   * Registered in wrangler secret AUTH0_JWK
   * n: RSA_PUBLIC_KEY
   * 
   * TODO fetch from web and save in cache.
   * 
   * Return client id if token is valid.
   */
  static async validate(tokenString, jwk) {
    const token = Jwt.decodeJwt(tokenString)
    const encoder = new TextEncoder()
    const data = encoder.encode([token.raw.header, token.raw.payload].join("."))
    const signature = new Uint8Array(
      Array.from(token.signature).map(char => char.charCodeAt(0)),
    )

    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    )
    
    const valid = crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature, data)

    if (valid) {
      return token.payload.azp
    }

    return undefined
  }

}
