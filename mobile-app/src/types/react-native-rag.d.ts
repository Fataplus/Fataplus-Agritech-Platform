/**
 * TypeScript declarations for react-native-rag library
 */

declare module 'react-native-rag' {
  export interface VectorStore {
    load(): Promise<this>;
    addDocument(document: string, metadata?: Record<string, any>): Promise<void>;
    search(query: string, k?: number): Promise<Array<{ content: string; metadata: Record<string, any>; score: number }>>;
  }

  export interface Embeddings {
    load(): Promise<this>;
    embed(text: string): Promise<number[]>;
  }

  export interface LLM {
    load(): Promise<this>;
    generate(prompt: string, options?: { maxTokens?: number; temperature?: number }): Promise<string>;
  }

  export class MemoryVectorStore implements VectorStore {
    constructor(params: { embeddings: Embeddings });
    load(): Promise<this>;
    addDocument(document: string, metadata?: Record<string, any>): Promise<void>;
    search(query: string, k?: number): Promise<Array<{ content: string; metadata: Record<string, any>; score: number }>>;
  }

  export interface RAGParams {
    vectorStore: VectorStore;
    llm: LLM;
    preventLoad?: boolean;
  }

  export interface UseRAGParams {
    vectorStore: VectorStore;
    llm: LLM;
    preventLoad?: boolean;
  }

  export interface UseRAGReturn {
    response: string;
    isReady: boolean;
    isGenerating: boolean;
    isStoring: boolean;
    error: string | null;
    generate: (input: string | Array<{ role: string; content: string }>, options?: { augmentedGeneration?: boolean; k?: number; callback?: (token: string) => void }) => Promise<string>;
    interrupt: () => void;
    splitAddDocument: (document: string, metadata?: Record<string, any>) => Promise<void>;
    addDocument: (document: string, metadata?: Record<string, any>) => Promise<void>;
    updateDocument: (id: string, document: string, metadata?: Record<string, any>) => Promise<void>;
    deleteDocument: (id: string) => Promise<void>;
  }

  export function useRAG(params: UseRAGParams): UseRAGReturn;

  export class RAG {
    constructor(params: RAGParams);
    load(): Promise<this>;
    unload(): Promise<void>;
    generate(input: string | Array<{ role: string; content: string }>, options?: { augmentedGeneration?: boolean; k?: number; callback?: (token: string) => void }): Promise<string>;
    interrupt(): void;
    splitAddDocument(document: string, metadata?: Record<string, any>): Promise<void>;
    addDocument(document: string, metadata?: Record<string, any>): Promise<void>;
    updateDocument(id: string, document: string, metadata?: Record<string, any>): Promise<void>;
    deleteDocument(id: string): Promise<void>;
  }
}

declare module '@react-native-rag/executorch' {
  export interface ExecuTorchEmbeddingsParams {
    modelSource: any;
    tokenizerSource: any;
  }

  export interface ExecuTorchLLMParams {
    modelSource: any;
    tokenizerSource: any;
    tokenizerConfigSource: any;
    responseCallback?: (token: string) => void;
  }

  export class ExecuTorchEmbeddings {
    constructor(params: ExecuTorchEmbeddingsParams);
    load(): Promise<this>;
    embed(text: string): Promise<number[]>;
  }

  export class ExecuTorchLLM {
    constructor(params: ExecuTorchLLMParams);
    load(): Promise<this>;
    generate(prompt: string, options?: { maxTokens?: number; temperature?: number }): Promise<string>;
  }

  // Model constants
  export const ALL_MINILM_L6_V2: any;
  export const ALL_MINILM_L6_V2_TOKENIZER: any;
  export const LLAMA3_2_1B_QLORA: any;
  export const LLAMA3_2_1B_TOKENIZER: any;
  export const LLAMA3_2_TOKENIZER_CONFIG: any;
}

declare module '@react-native-rag/op-sqlite' {
  // SQLite vector store implementation
  export class SQLiteVectorStore {
    constructor(params: { embeddings: any; dbPath?: string });
    load(): Promise<this>;
    addDocument(document: string, metadata?: Record<string, any>): Promise<void>;
    search(query: string, k?: number): Promise<Array<{ content: string; metadata: Record<string, any>; score: number }>>;
  }
}