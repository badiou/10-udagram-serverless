import {CustomAuthorizerEvent, CustomAuthorizerHandler, CustomAuthorizerResult} from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'

// on importe ces 2 bibliothèque pour vérifier le token généré depuis Auth0
import { verify } from 'jsonwebtoken'

import {JwtToken} from '../../auth/JwtToken'



//const auth0Secret=process.env.AUTH_0_SECRET
const secretId=process.env.AUTH_0_SECRET_ID
const secretField=process.env.AUTH_0_SECRET_FIELD

//on cré une instance de secretManager dans lequel on a socket les données secretes
const client= new AWS.SecretsManager()

//mettre en cache le secret si la fonction lambda est réutilisée
let cachedSecret: string

export const handler: CustomAuthorizerHandler = async (event: CustomAuthorizerEvent):Promise<CustomAuthorizerResult>=> {

try{
    //const decodedToken = verifyToken(event.authorizationToken)
    //cette fonction doit retourner aussi une Promise; Donc on ajoute await devant car elle est en async
    const decodedToken = await verifyToken(event.authorizationToken)

    console.log('User was authorized')
    return{
        //sub est définit dans le token généré depuis Auth0. Il est visible quand on décode le token sur Jwt.io
        principalId: decodedToken.sub,
        policyDocument:{
            Version:'2012-10-17',
            Statement:[
                {
                    //this allow to invoque any lambda function
                    Action:'execute-api:Invoke',
                    Effect: 'Allow',
                    Resource: '*'
                }
            ]
        }
    }

} catch(e)
{
    console.log('User was not authorized: ', e.message)
    return {
        principalId:'user',
        policyDocument:{
            Version:'2012-10-17',
            Statement:[
                {
                    Action:'execute-api:Invoke',
                    Effect: 'Deny',
                    Resource: '*'
                }
            ]
        }
    }

}
}
//function verifyToken(authHeader: string): JwtToken cette fonction ne sera plus un JwtToken car getSecret est en await. Donc elle doit retourner une Promise

async function verifyToken(authHeader: string): Promise<JwtToken>{
if (!authHeader)
    throw new Error('No authentication header')

if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

const split = authHeader.split(' ')
const token = split[1]

// if (token !=='123')
//     throw new Error ('Invalid token')

//A request has been authorized

// On appele ici la fonction getSecret

const secretObject:any= await getSecret()
const secret = secretObject[secretField]
return verify(token,secret ) as JwtToken

}
// cette fonction permet de récupérer les données secretes dans SSM..
//On vérifie si la données se trouve dans le cache. Sinon apres la recherche on l'ajoute dans le cache.

async function getSecret(){
    if (cachedSecret) return cachedSecret

    const data= await client
        .getSecretValue({
            SecretId: secretId
        }).promise()
        cachedSecret = data.SecretString

        return JSON.parse(cachedSecret)
}