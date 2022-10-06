import { TodosAccess } from '../datalayer/todosAcess'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'


const todosAccess = new TodosAccess()
/**
 * Get a todos from user
 * @param event an event from API Gateway
 *
 * @returns a user id from a JWT token
 */
export async function getTodosForUser(userId: string): Promise<TodoItem[]> {

  return todosAccess.getTodosForUser(userId);
}

/**
 * Get a todos from user
 * @param event an event from API Gateway
 *
 * @returns a user id from a JWT token
 */
export async function createTodo(userId: string, createTodoRequest: CreateTodoRequest): Promise<TodoItem> {

  return todosAccess.createTodo(userId, createTodoRequest);
}


/**
 * Update a todo By Key
 * @param event an event from API Gateway
 *
 * @returns Todo 
 */
export async function updateTodo(userId: string, todoId: string, updateTodoRequest: UpdateTodoRequest): Promise<TodoUpdate> {
  return todosAccess.updateTodo(userId, todoId, updateTodoRequest);
}


/**
 * Delete a todo By Key
 * @param event an event from API Gateway
 *
 * @returns Todo 
 */
export async function deleteTodo(userId: string, todoId: string): Promise<string> {
  return todosAccess.deleteTodo(userId, todoId);
}


/**
 * Get URL
 * @param event an event from API Gateway
 *
 * @returns URL 
 */
 export async function createAttachmentPresignedUrl(userId: string, todoId: string): Promise<string> {
  return todosAccess.createAttachmentPresignedUrl(userId, todoId);
}