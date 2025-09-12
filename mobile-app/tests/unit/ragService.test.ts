/**
 * Unit tests for RAG Service
 */

import { ragService } from '../../src/services/ragService';
import { chatService } from '../../src/services/chatService';

// Mock the react-native-rag library
jest.mock('react-native-rag', () => ({
  RAG: jest.fn().mockImplementation(() => ({
    load: jest.fn().mockResolvedValue(undefined),
    unload: jest.fn().mockResolvedValue(undefined),
    generate: jest.fn().mockResolvedValue('Sample AI response'),
    splitAddDocument: jest.fn().mockResolvedValue(undefined),
  })),
  MemoryVectorStore: jest.fn().mockImplementation(() => ({
    load: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock the executorch library
jest.mock('@react-native-rag/executorch', () => ({
  ExecuTorchEmbeddings: jest.fn().mockImplementation(() => ({
    load: jest.fn().mockResolvedValue(undefined),
  })),
  ExecuTorchLLM: jest.fn().mockImplementation(() => ({
    load: jest.fn().mockResolvedValue(undefined),
  })),
  ALL_MINILM_L6_V2: {},
  ALL_MINILM_L6_V2_TOKENIZER: {},
  LLAMA3_2_1B_QLORA: {},
  LLAMA3_2_1B_TOKENIZER: {},
  LLAMA3_2_TOKENIZER_CONFIG: {},
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    getAllKeys: jest.fn(),
    multiGet: jest.fn(),
    multiRemove: jest.fn(),
  },
}));

describe('RAG Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize the RAG system successfully', async () => {
      await ragService.initialize();
      expect(ragService.isReady()).toBe(true);
    });

    it('should handle initialization errors', async () => {
      // Mock an error during initialization
      const mockRAG = require('react-native-rag').RAG;
      mockRAG.mockImplementationOnce(() => ({
        load: jest.fn().mockRejectedValue(new Error('Initialization failed')),
      }));

      await expect(ragService.initialize()).rejects.toThrow('Failed to initialize RAG system');
      expect(ragService.isReady()).toBe(false);
    });
  });

  describe('generateResponse', () => {
    beforeEach(async () => {
      await ragService.initialize();
    });

    it('should generate a response successfully', async () => {
      const response = await ragService.generateResponse('Hello AI');
      expect(response).toBe('Sample AI response');
    });

    it('should handle generation errors', async () => {
      // Mock an error during generation
      const mockRAGInstance = (ragService as any).rag;
      mockRAGInstance.generate.mockRejectedValueOnce(new Error('Generation failed'));

      await expect(ragService.generateResponse('Hello AI')).rejects.toThrow('Failed to generate response');
    });

    it('should throw error if not initialized', async () => {
      // Create a new instance that hasn't been initialized
      const newRagService = new (Object.getPrototypeOf(ragService).constructor)();
      await expect(newRagService.generateResponse('Hello AI')).rejects.toThrow('RAG system not initialized');
    });
  });

  describe('addDocument', () => {
    beforeEach(async () => {
      await ragService.initialize();
    });

    it('should add a document successfully', async () => {
      await expect(ragService.addDocument('Sample document content')).resolves.not.toThrow();
    });

    it('should handle document addition errors', async () => {
      // Mock an error during document addition
      const mockRAGInstance = (ragService as any).rag;
      mockRAGInstance.splitAddDocument.mockRejectedValueOnce(new Error('Document addition failed'));

      await expect(ragService.addDocument('Sample document content')).rejects.toThrow('Failed to add document to vector store');
    });
  });

  describe('startHosting', () => {
    it('should start hosting and return a host ID', async () => {
      const hostId = await ragService.startHosting(8080);
      expect(hostId).toBeDefined();
      expect(typeof hostId).toBe('string');
    });
  });

  describe('generateQRCode', () => {
    it('should generate a QR code string', () => {
      const qrCode = ragService.generateQRCode('test-host-id');
      expect(qrCode).toBe('fataplus://connect/test-host-id');
    });
  });
});

describe('Chat Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a new chat session', async () => {
      const session = await chatService.createSession('Test Session');
      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.title).toBe('Test Session');
      expect(session.messages).toEqual([]);
    });
  });

  describe('addMessageToSession', () => {
    it('should add a message to a session', async () => {
      const session = await chatService.createSession('Test Session');
      const message = {
        id: 'test-message-id',
        role: 'user' as const,
        content: 'Hello AI',
        timestamp: new Date(),
      };

      await expect(chatService.addMessageToSession(session.id, message)).resolves.not.toThrow();
    });
  });
});