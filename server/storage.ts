import { type Document, type Query, type VectorEmbedding, type SystemMetrics, type InsertDocument, type InsertQuery, type InsertVectorEmbedding } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Documents
  getDocument(id: string): Promise<Document | undefined>;
  getDocumentByUrl(url: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, updates: Partial<Document>): Promise<Document>;
  listDocuments(): Promise<Document[]>;

  // Queries
  getQuery(id: string): Promise<Query | undefined>;
  createQuery(query: InsertQuery): Promise<Query>;
  updateQuery(id: string, updates: Partial<Query>): Promise<Query>;
  getQueriesByDocument(documentId: string): Promise<Query[]>;
  listQueries(limit?: number): Promise<Query[]>;

  // Vector embeddings
  createVectorEmbedding(embedding: InsertVectorEmbedding): Promise<VectorEmbedding>;
  getEmbeddingsByDocument(documentId: string): Promise<VectorEmbedding[]>;
  searchSimilarEmbeddings(embedding: number[], topK: number): Promise<VectorEmbedding[]>;

  // System metrics
  getSystemMetrics(): Promise<SystemMetrics>;
  updateSystemMetrics(updates: Partial<SystemMetrics>): Promise<SystemMetrics>;
  incrementDocumentsProcessed(): Promise<void>;
  incrementQueriesProcessed(): Promise<void>;
  updateAvgResponseTime(responseTime: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private documents: Map<string, Document> = new Map();
  private queries: Map<string, Query> = new Map();
  private vectorEmbeddings: Map<string, VectorEmbedding> = new Map();
  private systemMetrics: SystemMetrics;

  constructor() {
    this.systemMetrics = {
      id: randomUUID(),
      documentsProcessed: 1247,
      queriesProcessed: 5832,
      avgResponseTime: "2.3",
      accuracyRate: "94.2",
      totalTokensUsed: 284750,
      vectorDbSize: 1200000,
      lastUpdated: new Date(),
    };
  }

  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocumentByUrl(url: string): Promise<Document | undefined> {
    return Array.from(this.documents.values()).find(doc => doc.url === url);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const document: Document = {
      ...insertDocument,
      id,
      createdAt: new Date(),
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document> {
    const document = this.documents.get(id);
    if (!document) throw new Error("Document not found");
    
    const updated = { ...document, ...updates };
    this.documents.set(id, updated);
    return updated;
  }

  async listDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values()).sort(
      (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getQuery(id: string): Promise<Query | undefined> {
    return this.queries.get(id);
  }

  async createQuery(insertQuery: InsertQuery): Promise<Query> {
    const id = randomUUID();
    const query: Query = {
      ...insertQuery,
      id,
      createdAt: new Date(),
    };
    this.queries.set(id, query);
    return query;
  }

  async updateQuery(id: string, updates: Partial<Query>): Promise<Query> {
    const query = this.queries.get(id);
    if (!query) throw new Error("Query not found");
    
    const updated = { ...query, ...updates };
    this.queries.set(id, updated);
    return updated;
  }

  async getQueriesByDocument(documentId: string): Promise<Query[]> {
    return Array.from(this.queries.values())
      .filter(query => query.documentId === documentId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async listQueries(limit = 50): Promise<Query[]> {
    return Array.from(this.queries.values())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }

  async createVectorEmbedding(insertEmbedding: InsertVectorEmbedding): Promise<VectorEmbedding> {
    const id = randomUUID();
    const embedding: VectorEmbedding = {
      ...insertEmbedding,
      id,
      createdAt: new Date(),
    };
    this.vectorEmbeddings.set(id, embedding);
    return embedding;
  }

  async getEmbeddingsByDocument(documentId: string): Promise<VectorEmbedding[]> {
    return Array.from(this.vectorEmbeddings.values())
      .filter(embedding => embedding.documentId === documentId);
  }

  async searchSimilarEmbeddings(queryEmbedding: number[], topK: number): Promise<VectorEmbedding[]> {
    // Simple cosine similarity search (in production, use FAISS)
    const embeddings = Array.from(this.vectorEmbeddings.values());
    const similarities = embeddings.map(embedding => {
      const embeddingVector = embedding.embedding as number[];
      const similarity = this.cosineSimilarity(queryEmbedding, embeddingVector);
      return { embedding, similarity };
    });

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .map(item => item.embedding);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    return this.systemMetrics;
  }

  async updateSystemMetrics(updates: Partial<SystemMetrics>): Promise<SystemMetrics> {
    this.systemMetrics = { ...this.systemMetrics, ...updates, lastUpdated: new Date() };
    return this.systemMetrics;
  }

  async incrementDocumentsProcessed(): Promise<void> {
    this.systemMetrics.documentsProcessed++;
    this.systemMetrics.lastUpdated = new Date();
  }

  async incrementQueriesProcessed(): Promise<void> {
    this.systemMetrics.queriesProcessed++;
    this.systemMetrics.lastUpdated = new Date();
  }

  async updateAvgResponseTime(responseTime: number): Promise<void> {
    const currentAvg = parseFloat(this.systemMetrics.avgResponseTime || "0");
    const newAvg = (currentAvg + responseTime) / 2;
    this.systemMetrics.avgResponseTime = newAvg.toFixed(1);
    this.systemMetrics.lastUpdated = new Date();
  }
}

export const storage = new MemStorage();
