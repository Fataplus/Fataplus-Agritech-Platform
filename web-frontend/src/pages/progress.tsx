import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '@/components/Layout';
import TodoStats from '@/components/ui/TodoStats';
import TodoItem from '@/components/ui/TodoItem';
import { Todo, TodoResponse } from '@/types/todo';
import { TodoService } from '@/lib/api/todoService';

const ProgressPage: React.FC = () => {
  const [todoData, setTodoData] = useState<TodoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'in_progress' | 'pending'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      setLoading(true);
      const data = await TodoService.getTodos();
      setTodoData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des tâches');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: Todo['status']) => {
    try {
      await TodoService.updateTodo({ id, status });
      await loadTodos(); // Recharger les données
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    }
  };

  const getFilteredTodos = () => {
    if (!todoData) return [];

    let filtered = todoData.todos;

    // Filtre par statut
    if (filter !== 'all') {
      filtered = filtered.filter(todo => todo.status === filter);
    }

    // Filtre par catégorie
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(todo => todo.category === categoryFilter);
    }

    // Recherche textuelle
    if (searchTerm) {
      filtered = filtered.filter(todo => 
        todo.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        todo.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getUniqueCategories = () => {
    if (!todoData) return [];
    const uniqueCategories = Array.from(new Set(todoData.todos.map(todo => todo.category)));
    return uniqueCategories;
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>Progrès du Projet - Fataplus</title>
        <meta name="description" content="Suivez le progrès de développement de la plateforme Fataplus AgriTech" />
      </Head>
      
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* En-tête */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Progrès du Projet Fataplus
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Suivez en temps réel l&apos;avancement du développement de notre plateforme AgriTech révolutionnaire
              </p>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                <strong>Erreur:</strong> {error}
                <button 
                  onClick={loadTodos}
                  className="ml-4 text-red-600 underline hover:text-red-800"
                >
                  Réessayer
                </button>
              </div>
            )}

            {/* Statistiques */}
            {todoData && (
              <TodoStats stats={{
                total: todoData.total,
                completed: todoData.completed,
                in_progress: todoData.in_progress,
                pending: todoData.pending
              }} />
            )}

            {/* Filtres et recherche */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Recherche */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rechercher
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher dans les tâches..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Filtre par statut */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut
                  </label>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="completed">Terminé</option>
                    <option value="in_progress">En cours</option>
                    <option value="pending">En attente</option>
                  </select>
                </div>

                {/* Filtre par catégorie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">Toutes les catégories</option>
                    {getUniqueCategories().map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setFilter('all');
                    setCategoryFilter('all');
                    setSearchTerm('');
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  Réinitialiser les filtres
                </button>
                <button
                  onClick={loadTodos}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Actualiser
                </button>
              </div>
            </div>

            {/* Liste des tâches */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Tâches ({getFilteredTodos().length})
              </h2>
              
              {getFilteredTodos().length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune tâche trouvée</h3>
                  <p className="text-gray-500">
                    {searchTerm || filter !== 'all' || categoryFilter !== 'all' 
                      ? 'Essayez de modifier vos filtres de recherche.'
                      : 'Aucune tâche disponible pour le moment.'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {getFilteredTodos().map(todo => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      onUpdateStatus={handleStatusUpdate}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default ProgressPage;