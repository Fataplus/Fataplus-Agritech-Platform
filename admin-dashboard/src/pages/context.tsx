import { useQuery } from '@tanstack/react-query'
import {
  DatabaseIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon,
  TagIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { useState } from 'react'

interface ContextItem {
  id: string
  title: string
  type: 'article' | 'guide' | 'research' | 'technique'
  category: string
  author: string
  status: 'published' | 'draft' | 'archived'
  createdAt: Date
  updatedAt: Date
  views: number
  tags: string[]
  language: string
}

export default function ContextPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  // Mock data - replace with actual API calls
  const { data: contexts, isLoading } = useQuery({
    queryKey: ['contexts'],
    queryFn: async (): Promise<ContextItem[]> => {
      return [
        {
          id: '1',
          title: 'Techniques de Culture du Riz Irrigué',
          type: 'guide',
          category: 'Agriculture',
          author: 'Dr. Marie Dubois',
          status: 'published',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
          views: 1250,
          tags: ['riz', 'irrigation', 'culture'],
          language: 'fr'
        },
        {
          id: '2',
          title: 'Détection Précoce des Maladies des Plantes',
          type: 'research',
          category: 'Pathologie Végétale',
          author: 'Prof. Jean Rakoto',
          status: 'published',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
          views: 890,
          tags: ['maladies', 'diagnostic', 'prévention'],
          language: 'fr'
        },
        {
          id: '3',
          title: 'Optimisation de la Fertilisation Azotée',
          type: 'technique',
          category: 'Nutrition des Plantes',
          author: 'Sophie Martin',
          status: 'draft',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          views: 0,
          tags: ['fertilisation', 'azote', 'efficacité'],
          language: 'fr'
        },
        {
          id: '4',
          title: 'Impact du Changement Climatique sur l\'Agriculture',
          type: 'article',
          category: 'Climatologie',
          author: 'Pierre Andrian',
          status: 'published',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
          views: 2100,
          tags: ['climat', 'changement', 'adaptation'],
          language: 'fr'
        }
      ]
    }
  })

  const filteredContexts = contexts?.filter(context => {
    const matchesSearch = context.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         context.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         context.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = selectedType === 'all' || context.type === selectedType
    const matchesStatus = selectedStatus === 'all' || context.status === selectedStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-100'
      case 'draft': return 'text-yellow-600 bg-yellow-100'
      case 'archived': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'guide': return 'text-blue-600 bg-blue-100'
      case 'research': return 'text-purple-600 bg-purple-100'
      case 'technique': return 'text-green-600 bg-green-100'
      case 'article': return 'text-orange-600 bg-orange-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'guide': return '📖'
      case 'research': return '🔬'
      case 'technique': return '⚙️'
      case 'article': return '📄'
      default: return '📝'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Context Management</h1>
          <p className="text-gray-600 mt-1">Manage knowledge base and agricultural contexts</p>
        </div>
        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
          <PlusIcon className="h-5 w-5" />
          <span>Add Context</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-600">Total Contexts</h4>
              <p className="text-2xl font-bold text-gray-900">{contexts?.length || 0}</p>
            </div>
            <DocumentTextIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-600">Published</h4>
              <p className="text-2xl font-bold text-gray-900">
                {contexts?.filter(c => c.status === 'published').length || 0}
              </p>
            </div>
            <DatabaseIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-600">Total Views</h4>
              <p className="text-2xl font-bold text-gray-900">
                {contexts?.reduce((sum, c) => sum + c.views, 0).toLocaleString() || 0}
              </p>
            </div>
            <EyeIcon className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-600">Categories</h4>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(contexts?.map(c => c.category)).size || 0}
              </p>
            </div>
            <TagIcon className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search contexts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="guide">Guide</option>
              <option value="research">Research</option>
              <option value="technique">Technique</option>
              <option value="article">Article</option>
            </select>
          </div>
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contexts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredContexts?.map((context) => (
          <div key={context.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{getTypeIcon(context.type)}</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{context.title}</h3>
                  <p className="text-sm text-gray-600">by {context.author}</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(context.status)}`}>
                {context.status}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Type</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(context.type)}`}>
                  {context.type}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Category</span>
                <span className="text-sm font-medium">{context.category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Views</span>
                <span className="text-sm font-medium">{context.views.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Language</span>
                <span className="text-sm font-medium">{context.language.toUpperCase()}</span>
              </div>
            </div>

            {/* Tags */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {context.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                  >
                    <TagIcon className="h-3 w-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center text-xs text-gray-500">
                <ClockIcon className="h-4 w-4 mr-1" />
                Updated {context.updatedAt.toLocaleDateString()}
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                  <EyeIcon className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg">
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}