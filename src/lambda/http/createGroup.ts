import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS  from 'aws-sdk'
import * as uuid from 'uuid'

//cet import est ajouté pour utiliser le RS256
import { getUserId } from '../../auth/utils'

const docClient = new AWS.DynamoDB.DocumentClient()
const groupsTable = process.env.GROUPS_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Processing event: ', event)
  const itemId = uuid.v4()

  const parsedBody = JSON.parse(event.body)
  //###############################################################################################
  //Cette partie est ajoutée ssi on se décide d'utiliser l'authenfication avec RS256.. On ne stocke pas de token dans ce cadre.
  
  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]

  //###############################################################################################
  
  const newItem = {
    id: itemId,
    userId: getUserId(jwtToken), // cette ligne est ajoutée pour récupérer le userId en passant le token
    ...parsedBody,
   
  }

  await docClient.put({
    TableName: groupsTable,
    Item: newItem
  }).promise()

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      newItem
    })
  }
}
