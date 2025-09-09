"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTier } from '@/contexts/TierContext';
import { aiService, EnhancedAIContext } from '@/services/ai';
import { mcpClient } from '@/services/mcp';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Bot, User, LogIn, UserCheck } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

const ChatInterface: React.FC = () => {
  const { isAuthenticated, user, isAnonymous, sessionId, login } = useAuth();
  const { tier } = useTier();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [enhancedContext, setEnhancedContext] = useState<EnhancedAIContext | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Initialize enhanced context on mount
  useEffect(() => {
    const initContext = async () => {
      if (isAuthenticated && user) {
        try {
          const context = await mcpClient.buildEnhancedContext(
            '',
            user.id,
            sessionId || undefined
          );
          setEnhancedContext(context);
        } catch (error) {
          console.warn('Failed to load enhanced context:', error);
          // Use basic context as fallback
          setEnhancedContext({
            experience: user.tier === 'premium' ? 'advanced' : 'beginner',
            location: user.region,
          });
        }
      }
    };

    initContext();
  }, [isAuthenticated, user, sessionId]);

  // Show login prompt after first interaction
  useEffect(() => {
    if (messages.length > 0 && isAnonymous && !showLoginPrompt) {
      // Show login prompt after first message
      setTimeout(() => setShowLoginPrompt(true), 2000);
    }
  }, [messages.length, isAnonymous, showLoginPrompt]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // For anonymous users, allow unlimited messages but show login prompt later
    if (!isAuthenticated && !isAnonymous) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Create streaming assistant message
      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingMessage('');

      // Build enhanced context using AI Elements
      let context: EnhancedAIContext = enhancedContext || {
        experience: 'beginner',
        location: user?.region,
      };

      // If we have backend context, enhance it
      if (isAuthenticated && user) {
        try {
          context = await mcpClient.buildEnhancedContext(input, user.id, sessionId || undefined);
          setEnhancedContext(context);
        } catch (error) {
          console.warn('Failed to build enhanced context:', error);
        }
      }

      // Use AI Elements streaming with tools
      let fullResponse = '';
      for await (const chunk of aiService.streamResponse(input, context)) {
        fullResponse += chunk;
        setStreamingMessage(fullResponse);
      }

      // Update message with final content
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, content: fullResponse, isStreaming: false }
            : msg
        )
      );

      // Track interaction for context improvement (if authenticated)
      if (isAuthenticated && user && !isAnonymous) {
        try {
          await mcpClient.trackUserInteraction(user.id, {
            query: input,
            response: fullResponse,
            contextUsed: context,
          });
        } catch (error) {
          console.warn('Failed to track interaction:', error);
        }
      }

    } catch (error) {
      console.error('AI response error:', error);
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setStreamingMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Anonymous users can chat immediately, login prompt shows later
  if (!isAuthenticated && !isAnonymous) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-neutral-50 dark:bg-neutral-900 rounded-lg p-8">
        <div className="text-center">
          <Bot className="mx-auto h-12 w-12 text-primary-500 mb-4" />
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Start Your AgriBot Journey
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Try our AI agricultural assistant - no sign up required!
          </p>
          <Button onClick={login}>
            <LogIn className="h-4 w-4 mr-2" />
            Sign In (Optional)
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white dark:bg-neutral-900 rounded-lg shadow-lg overflow-hidden">
      {/* Chat Header */}
      <div className="bg-primary-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-earth-500 rounded-full flex items-center justify-center">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-semibold">AgriBot Assistant</h1>
            <p className="text-sm opacity-90">
              AI-powered agricultural guidance
              {isAnonymous && <span className="ml-2 text-yellow-300">• Guest Mode</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {!isAnonymous && <span className="text-primary-100">{tier.name}</span>}
          {isAnonymous && (
            <Button
              onClick={login}
              size="sm"
              variant="secondary"
              className="bg-white text-primary-600 hover:bg-gray-100"
            >
              <LogIn className="h-3 w-3 mr-1" />
              Sign In
            </Button>
          )}
          <span className="w-2 h-2 bg-sky-400 rounded-full animate-pulse"></span>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-neutral-500 dark:text-neutral-400">
            <Bot className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg">Start a conversation about agriculture</p>
            <p className="text-sm">Ask about crops, livestock, or market trends</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex items-start gap-2 max-w-xs lg:max-w-md">
                {message.role === 'assistant' && (
                  <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="h-3 w-3 text-white" />
                  </div>
                )}
                <div
                  className={`px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {message.isStreaming ? streamingMessage : message.content}
                  </p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="w-6 h-6 bg-secondary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isTyping && !streamingMessage && (
          <div className="flex justify-start">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="h-3 w-3 text-white" />
              </div>
              <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-2 rounded-lg">
                <div className="flex items-center gap-1">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-neutral-500">AgriBot is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Login Prompt for Anonymous Users */}
      {showLoginPrompt && isAnonymous && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-md mx-4">
            <div className="text-center">
              <UserCheck className="mx-auto h-12 w-12 text-primary-500 mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                Love AgriBot?
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                Sign in to save your conversations, get personalized recommendations, and unlock premium features.
              </p>
              <div className="flex gap-3">
                <Button onClick={login} className="flex-1">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowLoginPrompt(false)}
                  className="flex-1"
                >
                  Continue as Guest
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Container */}
      <div className="border-t border-neutral-200 dark:border-neutral-700 p-4">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask AgriBot about farming advice..."
            className="flex-1 resize-none max-h-32"
            rows={1}
            disabled={isTyping || tier.isLimitReached}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          {isAnonymous ? (
            <span className="text-yellow-600 dark:text-yellow-400">
              💡 Sign in to unlock personalized recommendations and conversation history
            </span>
          ) : tier.isLimitReached ? (
            'Monthly limit reached. Upgrade to premium for unlimited access.'
          ) : (
            `${tier.currentUsage.topicsUsed}/${tier.limits.monthlyTopics} topics used this month`
          )}
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;