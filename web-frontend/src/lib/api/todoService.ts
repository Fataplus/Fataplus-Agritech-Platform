import { Todo, TodoResponse, AddTodoRequest, UpdateTodoRequest } from '@/types/todo';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fataplus-api.fenohery.workers.dev';

export class TodoService {
  private static async apiRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  static async getTodos(): Promise<TodoResponse> {
    return this.apiRequest<TodoResponse>('/api/todos');
  }

  static async addTodo(todoData: AddTodoRequest): Promise<{ success: boolean; todo: Todo }> {
    return this.apiRequest<{ success: boolean; todo: Todo }>('/api/todos/add', {
      method: 'POST',
      body: JSON.stringify(todoData),
    });
  }

  static async updateTodo(updateData: UpdateTodoRequest): Promise<{ success: boolean; todo: Todo }> {
    return this.apiRequest<{ success: boolean; todo: Todo }>('/api/todos/update', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  static async markAsCompleted(id: string): Promise<{ success: boolean; todo: Todo }> {
    return this.updateTodo({ id, status: 'completed' });
  }

  static async markAsInProgress(id: string): Promise<{ success: boolean; todo: Todo }> {
    return this.updateTodo({ id, status: 'in_progress' });
  }

  static async markAsPending(id: string): Promise<{ success: boolean; todo: Todo }> {
    return this.updateTodo({ id, status: 'pending' });
  }
}