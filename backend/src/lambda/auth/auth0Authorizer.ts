import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
// added
const jwksUrl = 'https://dev-des5p2ow.us.auth0.com/.well-known/jwks.json';

const cert = `-----BEGIN CERTIFICATE-----
MIIDDTCCAfWgAwIBAgIJP2g2y8r0G01TMA0GCSqGSIb3DQEBCwUAMCQxIjAgBgNV
BAMTGWRldi1kZXM1cDJvdy51cy5hdXRoMC5jb20wHhcNMjIwNjMwMTUwOTU4WhcN
MzYwMzA4MTUwOTU4WjAkMSIwIAYDVQQDExlkZXYtZGVzNXAyb3cudXMuYXV0aDAu
Y29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA6O1CH6ceQF2kinah
J25mtODsri43iDqxm70pHKlrjEv3oxo0LNkBc6fDKVYLVjdjJrTKiDAPkt+hgkHv
kZASzmqqhGt6CX0cYzVTsWhD1ZnSG3vZdwfyGbLULWVjCWuJm0aWAopPnypQqg1n
KwV+ajWwmtCecxtHAL4B2dteD8GbZ/USJ5tpAAZVaWkErvqCca3ad8uFfdDjtvG1
eCYBSGdQnVgCQeGWFr6Dhq7lbUlJM40jMFfmejViCJNybS/2HtpsROuT2Ji+Keko
/pgEoyP4qkd7VSZ+VLxU9PVopyZvzfeW3LcCfNS5ltD+EzZb2UrGhNlEePSQRk4B
ROnaFwIDAQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBSLGLcV5lOl
Dg+wL3LiQ3gXhcOcrjAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEB
AOg9nIO1Zx2biC1OSpNeUKaXOzhVSpCnu/KpIN6321lgsyNXKvPVoQhkeHUUm2AJ
6xR+36Mpc7ZZQie2kkXygGj/9NsiiIoqf4Fakfe8BBz/FeASBFFCl3XN2jc71QwL
pkZdJxhU8BcqViNRu22C6c2g0fqCdmqSkPXBjaAToOKkTjihFuw88Wc/xY1eNlhz
SY10MKY4Q9vzpzafw1DNElMsk59eVkmKML/ifzQCkwoJH0qfXRDCKWqp9k0O41j7
3T4ocXvgTgOCowS1mIhuZAv9rvNXGEy85hPEJDkOJKBBRjbQnh2l0kSyN1Ov8zaU
9hb0prPJsjdKHYfpz13SZXw=
-----END CERTIFICATE-----`;

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt

  // TODO: Implement token verification
  // veryify token 
  console.log(jwt)

  verify(token, cert, {algorithms: ['RS256']});
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/
  return new Promise((resolve) => {
    return resolve(jwt.payload);
  })
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
