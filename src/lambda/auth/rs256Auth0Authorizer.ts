
import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
import { JwtToken } from '../../auth/JwtToken'


//ici on doit ajouter le certificat qui a été récupéré depuis la creation du onepage app sur Auth0
const cert = `-----BEGIN CERTIFICATE-----
MIIDBTCCAe2gAwIBAgIJD/kR1YPyfPWSMA0GCSqGSIb3DQEBCwUAMCAxHjAcBgNV
BAMTFWZzbmR0b2dvLmV1LmF1dGgwLmNvbTAeFw0yMDAyMTcwOTUwMzVaFw0zMzEw
MjYwOTUwMzVaMCAxHjAcBgNVBAMTFWZzbmR0b2dvLmV1LmF1dGgwLmNvbTCCASIw
DQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBANgirhMR1wghtX5uoW+o6PWw4oWY
hn6E51BNkmqew8BOSNHaYt90lOxFHGos5G3pTKTewSLycWl0F7ZFdB2jSiAVqXmJ
+hC9sITq18RG+1oJyn9lPciJfWLiqLYI6+qxpJ3CSq7I8MiA4VmlIBUqam4pxp5g
c/KepbObQb8qMdOx+lmpdbBe9VB4DSxqIlK/9MVf0LSPm8i/lnZw9QthMfd6n+oM
sBKrdsR+l6VhkB2432WNHxLWrNZspRcN0DH/Rf73aqRGKor3gdIrDTcxEGF1HTin
yTuTMRCf0iKx9dMMwPr6TnPs1qFuiOM7m1QgaTSzuapmbZzcN2kJrljh9KcCAwEA
AaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4EFgQUwNtnrW1nUKEOnMGv+TYa
xTLbNt0wDgYDVR0PAQH/BAQDAgKEMA0GCSqGSIb3DQEBCwUAA4IBAQB6gg3F4agQ
vLMaHc3mGqAbwhXAnvVvktPK6Ubst05pRJCLIFZgfgPaNIdF0jvXBrPuBAqmg+es
3SmIShFFaX3pzRY+qXvyzJ8wi15uwlfkaFS16fup/PEJQEmr0KXe4u26qHe13ZxD
pIfGI0DXWtirMG8qr8qE8LvZX88u43pq1TazQO/5N7Sp02mNeeTibvk4ELLbDF4q
wzILJvFtWPyoa5d9rE1YbDrY1neUVAdeohEmNl8Zjl5pp/9ZxiiiCHU8cT8W8aAn
PS7st0/uUxgvBOHgjFMmZwiplWDUGvAJ22/C3TwAaEaXbRwGPFfLcMxqoc0dSWj2
53y1pUcryHMo
-----END CERTIFICATE-----`

export const handler = async (event: CustomAuthorizerEvent): Promise<CustomAuthorizerResult> => {
  try {
    const jwtToken = verifyToken(event.authorizationToken)
    console.log('User was authorized', jwtToken)

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
    console.log('User authorized', e.message)

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

function verifyToken(authHeader: string): JwtToken {
  if (!authHeader)
    throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return verify(token, cert, { algorithms: ['RS256'] }) as JwtToken
}
