import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DeleteItemInput, DocumentClient, PutItemInput, QueryInput, UpdateItemInput } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { v4 as uuidv4 } from 'uuid';
// const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')
const isOffline = process.env.IS_OFFLINE

export class TodosAccess {

 
  constructor( 
    private readonly docClient = createDynamoDBClient(),
    private readonly todoTable = process.env.TODOS_TABLE
  ) { }
  /**
   * Get a todos from user
   * @param event an event from API Gateway
   *
   * @returns a user id from a JWT token
   */
  async getTodosForUser(userId: string): Promise<TodoItem[]> {
    logger.info('Query all todos' + userId );
    const param: QueryInput = {
      KeyConditions: {
        "userId": {
          AttributeValueList: [
             {"S":userId}
            ],
          ComparisonOperator: "EQ"
        }
      },
      TableName: this.todoTable,
    }
    const result = await this.docClient.query(param).promise();
    const todos = result.Items.map(data => {
      return {
        name: AWS.DynamoDB.Converter.output(data["name"]),
        createdAt: AWS.DynamoDB.Converter.output(data["createdAt"]),
        todoId: AWS.DynamoDB.Converter.output(data["todoId"]),
        dueDate: AWS.DynamoDB.Converter.output(data["dueDate"]),
        done: AWS.DynamoDB.Converter.output(data["done"])
      };
    })
    return todos as TodoItem[];
  }

  /**
   * Get a todos from user
   * @param event an event from API Gateway
   *
   * @returns a user id from a JWT token
   */
  async createTodo(userId: string, createTodoRequest: CreateTodoRequest): Promise<any> {
    console.log('Create todo', createTodoRequest);
    const createAt = new Date()
    const todoId = uuidv4()
    const param: PutItemInput = {
      Item: {
        "createdAt": { "S": createAt.toUTCString() },
        "name": { "S": createTodoRequest.name },
        "dueDate": { "S": createTodoRequest.dueDate },
        // "done": { "BOOL": createTodoRequest.done },
        // "attachmentUrl": { "S": createTodoRequest.attachmentUrl },
        "userId": { "S": userId },
        "todoId": {"S": todoId},
        "done": {"BOOL": false}
      },
      TableName: this.todoTable
    }
    await this.docClient.putItem(param).promise();
    return {
      name: createTodoRequest.name,
      createdAt: createAt.toUTCString(),
      todoId: todoId,
      dueDate: createTodoRequest.dueDate,
      done: false
    } as TodoItem;
  }


  /**
   * Update a todo By Key
   * @param event an event from API Gateway
   *
   * @returns Todo 
   */
  async updateTodo(userId: string, todoId: string, updateTodoRequest: UpdateTodoRequest): Promise<TodoUpdate> {

    const param: UpdateItemInput = {
      Key: {
        "todoId": {
          "S": todoId
        },
        "userId": {
          "S": userId
        }
      },
      AttributeUpdates: {
        "name": {
          "Value": {
            "S": updateTodoRequest.name
          }
        },
        "dueDate": {
          "Value": {
            "S": updateTodoRequest.dueDate
          }
        },
        "done": {
          "Value": {
            "BOOL": updateTodoRequest.done
          }
        }
      },
      TableName: this.todoTable
    }
    const result = await this.docClient.updateItem(param).promise();
    return result.$response.data as TodoUpdate;
  }


  /**
   * Delete a todo By Key
   * @param event an event from API Gateway
   *
   * @returns Todo 
   */
  async deleteTodo(userId: string, todoId: string): Promise<string> {

    const param: DeleteItemInput = {
      Key: {
        "todoId": {
          "S": todoId
        },
        "userId": {
          "S": userId
        }
      },
      TableName: this.todoTable
    }
    await this.docClient.deleteItem(param).promise();
    return '';
  }


}
function createDynamoDBClient() {
  if (isOffline) {
    console.log('Creating a local dynamoDB instance')
    return new AWS.DynamoDB({
      region: 'localhost',
      endpoint: 'http://localhost:8001'
    });
  }
  return new AWS.DynamoDB();
}