import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Tabs } from '../components/ui/Tabs';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';

interface SocialMediaPost {
  id: string;
  content: string;
  platforms: string[];
  scheduled_time?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  hashtags: string[];
  mentions: string[];
  created_at: string;
  published_at?: string;
}

interface AnalyticsData {
  platform: string;
  total_posts: number;
  total_engagement: number;
  avg_engagement_rate: number;
  best_performing_content: string;
  optimal_posting_times: string[];
  top_hashtags: string[];
  audience_growth: number;
  recommendations: string[];
}

const SocialMediaManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [contentForm, setContentForm] = useState({
    topic: '',
    platform: 'twitter',
    language: 'en'
  });
  const [postForm, setPostForm] = useState({
    content: '',
    platforms: ['twitter'],
    scheduled_time: '',
    hashtags: '',
    mentions: ''
  });

  useEffect(() => {
    fetchScheduledPosts();
    fetchAnalytics();
  }, []);

  const fetchScheduledPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/social-media/posts/scheduled');
      const data = await response.json();
      setPosts(data.scheduled_posts || []);
    } catch (err) {
      setError('Failed to fetch scheduled posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const platforms = ['twitter', 'facebook', 'instagram', 'linkedin'];
      const analyticsData = await Promise.all(
        platforms.map(async (platform) => {
          const response = await fetch(`/api/social-media/analytics/${platform}`);
          const data = await response.json();
          return data.analysis;
        })
      );
      setAnalytics(analyticsData);
    } catch (err) {
      setError('Failed to fetch analytics');
    }
  };

  const generateContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/social-media/content/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contentForm),
      });

      const data = await response.json();
      
      if (response.ok) {
        setPostForm(prev => ({
          ...prev,
          content: data.content
        }));
        setSuccess('Content generated successfully!');
      } else {
        setError(data.detail || 'Failed to generate content');
      }
    } catch (err) {
      setError('Failed to generate content');
    } finally {
      setLoading(false);
    }
  };

  const schedulePost = async () => {
    try {
      setLoading(true);
      setError(null);

      const postData = {
        ...postForm,
        hashtags: postForm.hashtags.split(',').map(tag => tag.trim()).filter(tag => tag),
        mentions: postForm.mentions.split(',').map(mention => mention.trim()).filter(mention => mention),
        scheduled_time: postForm.scheduled_time || new Date().toISOString()
      };

      const response = await fetch('/api/social-media/posts/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Post scheduled successfully!');
        setPostForm({
          content: '',
          platforms: ['twitter'],
          scheduled_time: '',
          hashtags: '',
          mentions: ''
        });
        fetchScheduledPosts();
      } else {
        setError(data.detail || 'Failed to schedule post');
      }
    } catch (err) {
      setError('Failed to schedule post');
    } finally {
      setLoading(false);
    }
  };

  const publishPost = async (postId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/social-media/posts/${postId}/publish`, {
        method: 'POST',
      });

      if (response.ok) {
        setSuccess('Post published successfully!');
        fetchScheduledPosts();
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to publish post');
      }
    } catch (err) {
      setError('Failed to publish post');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'content', label: 'Content Generation', icon: '📝' },
    { id: 'schedule', label: 'Schedule Posts', icon: '📅' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'accounts', label: 'Accounts', icon: '🔗' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Social Media Manager</h1>
            <p className="mt-2 text-gray-600">
              AI-powered social media management for agricultural content
            </p>
          </div>

          {error && (
            <Alert type="error" className="mb-6">
              {error}
            </Alert>
          )}

          {success && (
            <Alert type="success" className="mb-6">
              {success}
            </Alert>
          )}

          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}>
            {/* Content Generation Tab */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                <Card>
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Generate Agricultural Content</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Topic
                        </label>
                        <select
                          value={contentForm.topic}
                          onChange={(e) => setContentForm(prev => ({ ...prev, topic: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select a topic</option>
                          <option value="weather">Weather Update</option>
                          <option value="harvest">Harvest Season</option>
                          <option value="tips">Farming Tips</option>
                          <option value="market">Market Prices</option>
                          <option value="community">Community Spotlight</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Platform
                        </label>
                        <select
                          value={contentForm.platform}
                          onChange={(e) => setContentForm(prev => ({ ...prev, platform: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="twitter">Twitter</option>
                          <option value="facebook">Facebook</option>
                          <option value="instagram">Instagram</option>
                          <option value="linkedin">LinkedIn</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Language
                        </label>
                        <select
                          value={contentForm.language}
                          onChange={(e) => setContentForm(prev => ({ ...prev, language: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="en">English</option>
                          <option value="fr">French</option>
                          <option value="sw">Swahili</option>
                          <option value="mg">Malagasy</option>
                        </select>
                      </div>
                    </div>
                    <Button
                      onClick={generateContent}
                      disabled={loading || !contentForm.topic}
                      className="w-full md:w-auto"
                    >
                      {loading ? 'Generating...' : 'Generate Content'}
                    </Button>
                  </div>
                </Card>

                {postForm.content && (
                  <Card>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Generated Content</h3>
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <p className="text-gray-800 whitespace-pre-wrap">{postForm.content}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => setActiveTab('schedule')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Schedule This Post
                        </Button>
                        <Button
                          onClick={() => setPostForm(prev => ({ ...prev, content: '' }))}
                          variant="outline"
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Schedule Posts Tab */}
            {activeTab === 'schedule' && (
              <div className="space-y-6">
                <Card>
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Schedule New Post</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Content
                        </label>
                        <textarea
                          value={postForm.content}
                          onChange={(e) => setPostForm(prev => ({ ...prev, content: e.target.value }))}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your post content..."
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Platforms
                          </label>
                          <div className="space-y-2">
                            {['twitter', 'facebook', 'instagram', 'linkedin'].map(platform => (
                              <label key={platform} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={postForm.platforms.includes(platform)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setPostForm(prev => ({
                                        ...prev,
                                        platforms: [...prev.platforms, platform]
                                      }));
                                    } else {
                                      setPostForm(prev => ({
                                        ...prev,
                                        platforms: prev.platforms.filter(p => p !== platform)
                                      }));
                                    }
                                  }}
                                  className="mr-2"
                                />
                                <span className="capitalize">{platform}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Scheduled Time
                          </label>
                          <input
                            type="datetime-local"
                            value={postForm.scheduled_time}
                            onChange={(e) => setPostForm(prev => ({ ...prev, scheduled_time: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Hashtags (comma-separated)
                          </label>
                          <Input
                            value={postForm.hashtags}
                            onChange={(e) => setPostForm(prev => ({ ...prev, hashtags: e.target.value }))}
                            placeholder="#Agriculture, #Farming, #SustainableFarming"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mentions (comma-separated)
                          </label>
                          <Input
                            value={postForm.mentions}
                            onChange={(e) => setPostForm(prev => ({ ...prev, mentions: e.target.value }))}
                            placeholder="@username1, @username2"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={schedulePost}
                        disabled={loading || !postForm.content || postForm.platforms.length === 0}
                        className="w-full"
                      >
                        {loading ? 'Scheduling...' : 'Schedule Post'}
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Scheduled Posts</h2>
                    {posts.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No scheduled posts</p>
                    ) : (
                      <div className="space-y-4">
                        {posts.map((post) => (
                          <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex space-x-2">
                                {post.platforms.map(platform => (
                                  <Badge key={platform} className="bg-blue-100 text-blue-800">
                                    {platform}
                                  </Badge>
                                ))}
                                <Badge className={getStatusColor(post.status)}>
                                  {post.status}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-500">
                                {post.scheduled_time ? new Date(post.scheduled_time).toLocaleString() : 'No time set'}
                              </div>
                            </div>
                            <p className="text-gray-800 mb-3">{post.content}</p>
                            <div className="flex space-x-2">
                              {post.status === 'scheduled' && (
                                <Button
                                  onClick={() => publishPost(post.id)}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Publish Now
                                </Button>
                              )}
                              <Button size="sm" variant="outline">
                                Edit
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {analytics.map((data, index) => (
                    <Card key={index}>
                      <div className="p-6">
                        <h3 className="text-lg font-semibold mb-4 capitalize">{data.platform}</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Posts</span>
                            <span className="font-medium">{data.total_posts}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Engagement</span>
                            <span className="font-medium">{data.total_engagement}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Avg Rate</span>
                            <span className="font-medium">{data.avg_engagement_rate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Growth</span>
                            <span className="font-medium text-green-600">+{data.audience_growth}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {analytics.length > 0 && (
                  <Card>
                    <div className="p-6">
                      <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
                      <div className="space-y-3">
                        {analytics[0]?.recommendations.map((recommendation, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            <p className="text-gray-700">{recommendation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Accounts Tab */}
            {activeTab === 'accounts' && (
              <div className="space-y-6">
                <Card>
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Connected Accounts</h2>
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">No social media accounts connected yet</p>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        Connect Account
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default SocialMediaManager;