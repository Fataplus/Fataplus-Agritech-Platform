import React from 'react';
import { Todo } from '@/types/todo';

interface TodoItemProps {
  todo: Todo;
  onUpdateStatus: (id: string, status: Todo['status']) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, onUpdateStatus }) => {
  const getStatusColor = (status: Todo['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: Todo['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      infrastructure: 'text-purple-600 bg-purple-100',
      ai: 'text-indigo-600 bg-indigo-100',
      frontend: 'text-cyan-600 bg-cyan-100',
      api: 'text-teal-600 bg-teal-100',
      enhancement: 'text-pink-600 bg-pink-100',
      general: 'text-gray-600 bg-gray-100'
    };
    return colors[category] || 'text-gray-600 bg-gray-100';
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date invalide';
    }
  };

  const getStatusIcon = (status: Todo['status']) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'in_progress':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        );
      case 'pending':
        return (
          <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            {getStatusIcon(todo.status)}
            <h3 className="text-lg font-semibold text-gray-900 flex-1">
              {todo.content}
            </h3>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(todo.status)}`}>
              {todo.status.replace('_', ' ').toUpperCase()}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(todo.priority)}`}>
              {todo.priority.toUpperCase()}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(todo.category)}`}>
              {todo.category.toUpperCase()}
            </span>
          </div>

          <div className="text-sm text-gray-500 space-y-1">
            <p>Créé: {formatDate(todo.created)}</p>
            {todo.updated && <p>Mis à jour: {formatDate(todo.updated)}</p>}
            {todo.completed && <p>Terminé: {formatDate(todo.completed)}</p>}
          </div>
        </div>

        <div className="ml-4">
          <div className="flex flex-col gap-2">
            {todo.status !== 'pending' && (
              <button
                onClick={() => onUpdateStatus(todo.id, 'pending')}
                className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
              >
                Pending
              </button>
            )}
            {todo.status !== 'in_progress' && (
              <button
                onClick={() => onUpdateStatus(todo.id, 'in_progress')}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                In Progress
              </button>
            )}
            {todo.status !== 'completed' && (
              <button
                onClick={() => onUpdateStatus(todo.id, 'completed')}
                className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              >
                Completed
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodoItem;