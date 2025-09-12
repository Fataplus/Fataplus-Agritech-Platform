/**
 * Chat Service for Fataplus Mobile App
 * Manages chat sessions, messages, and conversation history
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage, ChatSession } from './ragService';

class ChatService {
  private storageKeyPrefix = 'fataplus_chat_';

  /**
   * Create a new chat session
   * @param title Session title
   */
  async createSession(title: string): Promise<ChatSession> {
    const sessionId = this.generateSessionId();
    const now = new Date();

    const session: ChatSession = {
      id: sessionId,
      title,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    await this.saveSession(session);
    return session;
  }

  /**
   * Get a chat session by ID
   * @param sessionId Session identifier
   */
  async getSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const sessionData = await AsyncStorage.getItem(`${this.storageKeyPrefix}${sessionId}`);
      if (sessionData) {
        const session: ChatSession = JSON.parse(sessionData);
        // Convert date strings back to Date objects
        session.createdAt = new Date(session.createdAt);
        session.updatedAt = new Date(session.updatedAt);
        session.messages = session.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        return session;
      }
      return null;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  /**
   * Save a chat session
   * @param session Chat session to save
   */
  async saveSession(session: ChatSession): Promise<void> {
    try {
      const sessionData = JSON.stringify(session);
      await AsyncStorage.setItem(`${this.storageKeyPrefix}${session.id}`, sessionData);
    } catch (error) {
      console.error('Failed to save session:', error);
      throw new Error('Failed to save chat session');
    }
  }

  /**
   * Add a message to a chat session
   * @param sessionId Session identifier
   * @param message Chat message to add
   */
  async addMessageToSession(sessionId: string, message: ChatMessage): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (session) {
        session.messages.push(message);
        session.updatedAt = new Date();
        await this.saveSession(session);
      }
    } catch (error) {
      console.error('Failed to add message to session:', error);
      throw new Error('Failed to add message to chat session');
    }
  }

  /**
   * Get all chat sessions
   */
  async getAllSessions(): Promise<ChatSession[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const sessionKeys = keys.filter(key => key.startsWith(this.storageKeyPrefix));
      
      const sessionData = await AsyncStorage.multiGet(sessionKeys);
      const sessions: ChatSession[] = [];

      for (const [key, value] of sessionData) {
        if (value) {
          try {
            const session: ChatSession = JSON.parse(value);
            // Convert date strings back to Date objects
            session.createdAt = new Date(session.createdAt);
            session.updatedAt = new Date(session.updatedAt);
            session.messages = session.messages.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            }));
            sessions.push(session);
          } catch (parseError) {
            console.error(`Failed to parse session data for key ${key}:`, parseError);
          }
        }
      }

      // Sort by updated date (newest first)
      sessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      return sessions;
    } catch (error) {
      console.error('Failed to get all sessions:', error);
      return [];
    }
  }

  /**
   * Delete a chat session
   * @param sessionId Session identifier
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${this.storageKeyPrefix}${sessionId}`);
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw new Error('Failed to delete chat session');
    }
  }

  /**
   * Clear all chat sessions
   */
  async clearAllSessions(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const sessionKeys = keys.filter(key => key.startsWith(this.storageKeyPrefix));
      await AsyncStorage.multiRemove(sessionKeys);
    } catch (error) {
      console.error('Failed to clear sessions:', error);
      throw new Error('Failed to clear chat sessions');
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  /**
   * Generate a unique message ID
   */
  generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }
}

// Export singleton instance
export const chatService = new ChatService();