import { jwtVerify, type JWTPayload, SignJWT } from 'jose'

export type VerifiedToken = {
  payload: JWTPayload
  issuer?: string
  subject?: string
  audience?: string | string[]
}

export async function verifyJwtToken(input: {
  token: string
  secret: string
  issuer?: string
  audience?: string | string[]
}): Promise<VerifiedToken> {
  const secret = new TextEncoder().encode(input.secret)
  const result = await jwtVerify(input.token, secret, {
    issuer: input.issuer,
    audience: input.audience,
  })

  return {
    payload: result.payload,
    issuer: result.payload.iss,
    subject: result.payload.sub,
    audience: result.payload.aud,
  }
}

export async function signTestJwt(input: {
  secret: string
  issuer?: string
  audience?: string | string[]
  subject?: string
}): Promise<string> {
  const secret = new TextEncoder().encode(input.secret)
  let jwt = new SignJWT({ scope: 'operator' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')

  if (input.issuer) {
    jwt = jwt.setIssuer(input.issuer)
  }

  if (input.audience) {
    jwt = jwt.setAudience(input.audience)
  }

  if (input.subject) {
    jwt = jwt.setSubject(input.subject)
  }

  return jwt.sign(secret)
}
