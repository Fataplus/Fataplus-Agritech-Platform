export interface Todo {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  category: string;
  created: string;
  updated?: string;
  completed?: string;
}

export interface TodoStats {
  total: number;
  completed: number;
  in_progress: number;
  pending: number;
}

export interface TodoResponse {
  todos: Todo[];
  total: number;
  completed: number;
  in_progress: number;
  pending: number;
}

export interface AddTodoRequest {
  content: string;
  priority: 'high' | 'medium' | 'low';
  category?: string;
  status?: 'pending' | 'in_progress' | 'completed';
}

export interface UpdateTodoRequest {
  id: string;
  content?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  priority?: 'high' | 'medium' | 'low';
  category?: string;
}