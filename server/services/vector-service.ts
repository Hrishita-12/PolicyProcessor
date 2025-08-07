import { storage } from "../storage";
import { llmService } from "./llm-service";
import { VectorEmbedding, InsertVectorEmbedding } from "@shared/schema";

export class VectorService {
  async createEmbeddings(documentId: string, chunks: string[]): Promise<void> {
    try {
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (chunk.trim().length === 0) continue;

        // Generate embedding for chunk
        const embedding = await llmService.generateEmbedding(chunk);

        // Store embedding
        const insertEmbedding: InsertVectorEmbedding = {
          documentId,
          chunkIndex: i,
          content: chunk,
          embedding: embedding,
        };

        await storage.createVectorEmbedding(insertEmbedding);
      }
    } catch (error) {
      console.error('Error creating embeddings:', error);
      throw new Error('Failed to create embeddings');
    }
  }

  async searchRelevantContext(
    query: string, 
    documentId?: string, 
    topK: number = 5
  ): Promise<{
    relevantChunks: string[];
    relevantClauses: Array<{
      section: string;
      content: string;
      similarity: number;
    }>;
  }> {
    try {
      // Generate query embedding
      const queryEmbedding = await llmService.generateEmbedding(query);

      // Search for similar embeddings
      let similarEmbeddings: VectorEmbedding[];
      
      if (documentId) {
        // Search within specific document
        const allEmbeddings = await storage.getEmbeddingsByDocument(documentId);
        similarEmbeddings = this.findMostSimilar(queryEmbedding, allEmbeddings, topK);
      } else {
        // Global search across all documents
        similarEmbeddings = await storage.searchSimilarEmbeddings(queryEmbedding, topK);
      }

      // Extract relevant chunks
      const relevantChunks = similarEmbeddings.map(embedding => embedding.content);

      // Generate clause information with similarity scores
      const relevantClauses = similarEmbeddings.map((embedding, index) => ({
        section: `Section ${embedding.chunkIndex + 1}`,
        content: embedding.content.substring(0, 200) + (embedding.content.length > 200 ? '...' : ''),
        similarity: this.calculateSimilarity(queryEmbedding, embedding.embedding as number[]),
      }));

      return { relevantChunks, relevantClauses };
    } catch (error) {
      console.error('Error searching relevant context:', error);
      throw new Error('Failed to search relevant context');
    }
  }

  private findMostSimilar(
    queryEmbedding: number[], 
    embeddings: VectorEmbedding[], 
    topK: number
  ): VectorEmbedding[] {
    const similarities = embeddings.map(embedding => ({
      embedding,
      similarity: this.calculateSimilarity(queryEmbedding, embedding.embedding as number[]),
    }));

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .map(item => item.embedding);
  }

  private calculateSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length) return 0;
    
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  async getVectorStats(): Promise<{
    totalEmbeddings: number;
    documentsWithEmbeddings: number;
    avgChunksPerDocument: number;
  }> {
    // This would be more efficient with proper database queries
    const documents = await storage.listDocuments();
    const processedDocs = documents.filter(doc => doc.processed);
    
    let totalEmbeddings = 0;
    for (const doc of processedDocs) {
      const embeddings = await storage.getEmbeddingsByDocument(doc.id);
      totalEmbeddings += embeddings.length;
    }

    return {
      totalEmbeddings,
      documentsWithEmbeddings: processedDocs.length,
      avgChunksPerDocument: processedDocs.length > 0 ? totalEmbeddings / processedDocs.length : 0,
    };
  }
}

export const vectorService = new VectorService();
