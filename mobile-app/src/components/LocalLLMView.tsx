/**
 * Local LLM View Component for Fataplus Mobile App
 * Main interface for offline LLM interaction with peer-to-peer sharing
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  FlatList,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { ragService, ChatMessage, ChatSession } from '../services/ragService';
import { qrService, ConnectionInfo } from '../services/qrService';
import { networkService } from '../services/networkService';
import { chatService } from '../services/chatService';
import QRCode from 'react-native-qrcode-svg';

interface LocalLLMViewProps {
  onBack: () => void;
}

const LocalLLMView: React.FC<LocalLLMViewProps> = ({ onBack }) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isHosting, setIsHosting] = useState(false);
  const [hostId, setHostId] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState('');
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    initializeRAG();
    loadSessions();
  }, []);

  /**
   * Initialize the RAG system
   */
  const initializeRAG = async () => {
    try {
      setIsInitializing(true);
      await ragService.initialize();
      await networkService.initializeWifiP2P();
      
      // Create initial session
      const session = await chatService.createSession('New Conversation');
      setCurrentSession(session);
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize offline AI assistant');
      console.error('Initialization error:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  /**
   * Load all chat sessions
   */
  const loadSessions = async () => {
    try {
      const loadedSessions = await chatService.getAllSessions();
      setSessions(loadedSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  /**
   * Start hosting the local LLM
   */
  const startHosting = async () => {
    try {
      const newHostId = await ragService.startHosting();
      const ipAddress = await networkService.getDeviceIpAddress();
      
      setHostId(newHostId);
      setIsHosting(true);
      
      // Generate QR code for sharing
      const qrData = qrService.generateHostingQRCode(
        newHostId,
        ipAddress,
        8080,
        'Fataplus Agricultural Assistant'
      );
      
      setQrCodeData(qrData);
      setShowQRCode(true);
      
      Alert.alert('Hosting Started', 'Others can now connect to your local AI assistant');
    } catch (error) {
      Alert.alert('Error', 'Failed to start hosting');
      console.error('Hosting error:', error);
    }
  };

  /**
   * Stop hosting the local LLM
   */
  const stopHosting = () => {
    setIsHosting(false);
    setHostId('');
    setShowQRCode(false);
    setQrCodeData('');
    Alert.alert('Hosting Stopped', 'Local AI assistant is no longer available for sharing');
  };

  /**
   * Handle QR code scan
   */
  const handleQRScan = () => {
    setIsScanning(true);
    // In a real implementation, this would open the camera to scan QR codes
    // For now, we'll simulate with an alert
    Alert.prompt(
      'Scan QR Code',
      'Enter the QR code data manually:',
      [
        { text: 'Cancel', onPress: () => setIsScanning(false), style: 'cancel' },
        {
          text: 'Connect',
          onPress: (data) => {
            if (data) {
              processScannedQRCode(data);
            }
            setIsScanning(false);
          },
        },
      ],
      'plain-text'
    );
  };

  /**
   * Process scanned QR code data
   */
  const processScannedQRCode = (data: string) => {
    try {
      const info = qrService.parseConnectionQRCode(data);
      if (info && qrService.isConnectionInfoFresh(info)) {
        setConnectionInfo(info);
        Alert.alert(
          'Connection Info',
          `Host: ${info.ipAddress}\nModel: ${info.modelName}`,
          [
            {
              text: 'Connect',
              onPress: () => connectToRemoteHost(info),
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Invalid QR Code', 'Could not parse connection information');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process QR code');
      console.error('QR processing error:', error);
    }
  };

  /**
   * Connect to a remote LLM host
   */
  const connectToRemoteHost = async (info: ConnectionInfo) => {
    try {
      // In a real implementation, this would connect to the remote host
      // For now, we'll just simulate the connection
      Alert.alert(
        'Connected',
        `Connected to ${info.ipAddress}:${info.port}\nYou can now use the remote AI assistant`
      );
    } catch (error) {
      Alert.alert('Connection Failed', 'Could not connect to the remote host');
      console.error('Connection error:', error);
    }
  };

  /**
   * Generate a response from the LLM
   */
  const generateResponse = async () => {
    if (!userInput.trim() || !currentSession) return;

    try {
      setIsGenerating(true);

      // Add user message to session
      const userMessage: ChatMessage = {
        id: chatService.generateMessageId(),
        role: 'user',
        content: userInput,
        timestamp: new Date(),
      };

      await chatService.addMessageToSession(currentSession.id, userMessage);

      // Update UI immediately
      const updatedSession = {
        ...currentSession,
        messages: [...currentSession.messages, userMessage],
        updatedAt: new Date(),
      };
      setCurrentSession(updatedSession);

      // Clear input
      setUserInput('');

      // Generate AI response
      const response = await ragService.generateResponse(userInput);

      // Add AI response to session
      const aiMessage: ChatMessage = {
        id: chatService.generateMessageId(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      await chatService.addMessageToSession(currentSession.id, aiMessage);

      // Update UI with AI response
      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, aiMessage],
        updatedAt: new Date(),
      };
      setCurrentSession(finalSession);

      // Log messages for traceability
      await ragService.logChatMessage(userMessage, currentSession.id);
      await ragService.logChatMessage(aiMessage, currentSession.id);

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate response from AI assistant');
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Create a new chat session
   */
  const createNewSession = async () => {
    try {
      const session = await chatService.createSession('New Conversation');
      setCurrentSession(session);
      loadSessions(); // Refresh session list
    } catch (error) {
      Alert.alert('Error', 'Failed to create new conversation');
      console.error('Session creation error:', error);
    }
  };

  /**
   * Switch to a different chat session
   */
  const switchToSession = async (sessionId: string) => {
    try {
      const session = await chatService.getSession(sessionId);
      if (session) {
        setCurrentSession(session);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load conversation');
      console.error('Session loading error:', error);
    }
  };

  /**
   * Delete a chat session
   */
  const deleteSession = async (sessionId: string) => {
    try {
      await chatService.deleteSession(sessionId);
      loadSessions(); // Refresh session list
      
      // If we deleted the current session, create a new one
      if (currentSession && currentSession.id === sessionId) {
        createNewSession();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete conversation');
      console.error('Session deletion error:', error);
    }
  };

  if (isInitializing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Initializing Offline AI Assistant...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offline AI Assistant</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Session Selector */}
      <View style={styles.sessionSelector}>
        <Text style={styles.sessionLabel}>Conversation:</Text>
        <TouchableOpacity onPress={createNewSession} style={styles.newSessionButton}>
          <Text style={styles.newSessionButtonText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Chat Display */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
      >
        {currentSession?.messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageContainer,
              message.role === 'user' ? styles.userMessage : styles.aiMessage,
            ]}
          >
            <Text style={styles.messageText}>{message.content}</Text>
            <Text style={styles.timestamp}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        ))}
        {isGenerating && (
          <View style={[styles.messageContainer, styles.aiMessage]}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.generatingText}>Thinking...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={userInput}
          onChangeText={setUserInput}
          placeholder="Ask about farming, weather, crops..."
          multiline
          editable={!isGenerating}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!userInput.trim() || isGenerating) && styles.sendButtonDisabled]}
          onPress={generateResponse}
          disabled={!userInput.trim() || isGenerating}
        >
          <Text style={styles.sendButtonText}>
            {isGenerating ? '...' : 'Send'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {isHosting ? (
          <TouchableOpacity style={styles.actionButton} onPress={stopHosting}>
            <Text style={styles.actionButtonText}>Stop Sharing</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.actionButton} onPress={startHosting}>
            <Text style={styles.actionButtonText}>Share My AI</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionButton} onPress={handleQRScan}>
          <Text style={styles.actionButtonText}>Connect to AI</Text>
        </TouchableOpacity>
      </View>

      {/* QR Code Modal */}
      <Modal
        visible={showQRCode}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowQRCode(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share Your AI Assistant</Text>
            <Text style={styles.modalSubtitle}>
              Others can scan this QR code to connect to your local AI
            </Text>
            {qrCodeData ? (
              <QRCode value={qrCodeData} size={200} />
            ) : (
              <ActivityIndicator size="large" color="#007AFF" />
            )}
            <Text style={styles.connectionInfo}>
              Host ID: {hostId}
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowQRCode(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  sessionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sessionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  newSessionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newSessionButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  userMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    backgroundColor: 'white',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
  generatingText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  connectionInfo: {
    marginTop: 16,
    fontSize: 12,
    color: '#666',
  },
  modalCloseButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalCloseButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default LocalLLMView;