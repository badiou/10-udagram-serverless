import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS  from 'aws-sdk'
import * as uuid from 'uuid'

const docClient = new AWS.DynamoDB.DocumentClient()
const groupsTable = process.env.GROUPS_TABLE
const imagesTable = process.env.IMAGES_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Processing event: ', event)
  const groupId=event.pathParameters.groupId

  //on vérifie si le groupe existe avant de créer l'image
  const validGroupId=await groupExists(groupId)
  
  if(!validGroupId) {
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
       error: 'Group does not exist'
      })
    }
   }
   
  const itemId = uuid.v4()
  const timestamp=new Date().toISOString()
  const parsedBody = JSON.parse(event.body)

  const newImage = {
    groupId: groupId,
    imageId: itemId,
    timestamp:timestamp,
    ...parsedBody
  }

  console.log('Storing new item: ', parsedBody)

  await docClient.put({
    TableName: imagesTable,
    Item: newImage
  }).promise()

   return{
     statusCode: 201,
     headers: {
       'Access-Control-Allow-Origin': '*'
     },
     body: JSON.stringify({
      result: newImage
     })

   }
}

//cette fonction permet de vérifier si le group recherché existe dans la base de données ou pas
async function groupExists(groupId: string){
  const result=await docClient
  .get({
    TableName: groupsTable,
    Key: {
      id : groupId
    }
  })
  .promise()
  console.log('Get Group:', result)
  return !!result.Item

}
