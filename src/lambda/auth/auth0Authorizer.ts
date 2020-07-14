// import {CustomAuthorizerEvent, CustomAuthorizerHandler, CustomAuthorizerResult} from 'aws-lambda'
//with middy middleware we don't need to use CustomAuthorizerHandler

import {CustomAuthorizerEvent, CustomAuthorizerResult} from 'aws-lambda'
import 'source-map-support/register'
// import * as AWS from 'aws-sdk'

// on importe ces 2 bibliothèque pour vérifier le token généré depuis Auth0
import { verify } from 'jsonwebtoken'

import {JwtToken} from '../../auth/JwtToken'

//importation pour utiliser middy middleware
import * as middy from 'middy'

import {secretsManager } from 'middy/middlewares'


//const auth0Secret=process.env.AUTH_0_SECRET
const secretId=process.env.AUTH_0_SECRET_ID
const secretField=process.env.AUTH_0_SECRET_FIELD

//on cré une instance de secretManager dans lequel on a socket les données secretes
// const client= new AWS.SecretsManager()

//mettre en cache le secret si la fonction lambda est réutilisée
// let cachedSecret: string

//export const handler: CustomAuthorizerHandler = async (event: CustomAuthorizerEvent):Promise<CustomAuthorizerResult>=> {
    //pour utiliser le middy middleware on change la ligne plus haut avec celle ci
export const handler= middy(async (event: CustomAuthorizerEvent,
    context
    ):Promise<CustomAuthorizerResult>=> {
try{
    //const decodedToken = verifyToken(event.authorizationToken)
    //cette fonction doit retourner aussi une Promise; Donc on ajoute await devant car elle est en async
    const decodedToken =  verifyToken(
        event.authorizationToken,
        context.AUTH0_SECRET[secretField])

    console.log('User was authorized :', decodedToken)
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
})
//function verifyToken(authHeader: string): JwtToken cette fonction ne sera plus un JwtToken car getSecret est en await. Donc elle doit retourner une Promise

 function verifyToken(authHeader: string, secret:string): JwtToken{
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

//This 2 lines is used when i get data from SSM on aws
//const secretObject:any= await getSecret()
//const secret = secretObject[secretField]
return verify(token,secret ) as JwtToken

}
// cette fonction permet de récupérer les données secretes dans SSM..
//On vérifie si la données se trouve dans le cache. Sinon apres la recherche on l'ajoute dans le cache.

// async function getSecret(){
    
//     if (cachedSecret) return cachedSecret

//     const data= await client
//         .getSecretValue({
//             SecretId: secretId
//         }).promise()
//         cachedSecret = data.SecretString

//         return JSON.parse(cachedSecret)
// }

//on utilise plutôt ce code ci-dessous

//quand on utilise middy middleware, on n'a plus besoin de ce code
handler.use(
    secretsManager({
        cache: true,
        cacheExpiryInMillis: 60000,
        throwOnFailedCall: true,
        secrets:{
            AUTH0_SECRET: secretId
        }
    })
)
